import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });
for (const scheme of ['light','dark']) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, colorScheme:scheme });
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}]);
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
  await p.waitForTimeout(2500);
  await p.screenshot({path:`/home/claude/shots/hero-${scheme}.png`, clip:{x:0,y:0,width:1440,height:760}});
  if (scheme==='light') {
    // 火を入れる（長押し）
    const btn = await p.$('.fire-btn');
    if (btn) {
      const box = await btn.boundingBox();
      await p.mouse.move(box.x+box.width/2, box.y+box.height/2);
      await p.mouse.down();
      await p.waitForTimeout(1400);
      await p.mouse.up();
      await p.waitForTimeout(1800);
      await p.screenshot({path:'/home/claude/shots/hero-lit.png', clip:{x:0,y:0,width:1440,height:760}});
      const st = await p.evaluate(()=>({
        lit: !!document.querySelector('.smoke-stage.is-lit'),
        status: (document.querySelector('.fire-status')||{}).textContent,
        dash: (document.querySelector('.smoke-thread path')||{}).style?.strokeDashoffset,
        puffs: document.querySelectorAll('.puff').length,
      }));
      console.log('LIT:', JSON.stringify(st));
    } else console.log('no fire-btn found');
  }
  console.log(scheme,'errors:',errs.length? errs : 'none');
  await ctx.close();
}
await b.close();
