import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
for (const [name, vp, mob] of [['d',{width:1440,height:900},false],['m',{width:390,height:844},true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob?2:1 })
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2200)
  const heroH = await p.evaluate(()=>{const e=document.querySelector('.scrub')||document.querySelector('.still');return e.getBoundingClientRect().height})
  let y = Math.round(heroH)
  for (let i=0;i<4;i++){
    await p.evaluate(v=>window.scrollTo(0,v), y); await p.waitForTimeout(1100)
    await p.screenshot({path:`/home/claude/scrub/${name}${i}.png`, clip:{x:0,y:0,width:vp.width,height:vp.height}})
    y += vp.height - 40
  }
  console.log(name, 'errors', errs.filter(e=>!/TUNNEL|font/i.test(e)).length)
  await ctx.close()
}
await b.close()
