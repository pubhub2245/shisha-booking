import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
for (const [name, opt] of [['pc',{viewport:{width:1440,height:900}}],['sp',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]) {
  const p = await (await b.newContext(opt)).newPage()
  p.on('console', m=>{ if(m.type()==='error') console.log(name,'ERR',m.text().slice(0,110)) })
  p.on('pageerror', e=>console.log(name,'PAGEERR',e.message.slice(0,110)))
  await p.goto('file:///home/claude/endo-preview.html'); await p.waitForTimeout(4000)
  const H = opt.viewport.height, W = opt.viewport.width
  const range = await p.evaluate(()=>document.querySelector('.scrub').getBoundingClientRect().height - innerHeight)
  // ヒーローの真ん中
  await p.evaluate(y=>window.scrollTo(0,y), Math.round(0.5*range)); await p.waitForTimeout(1300)
  await p.screenshot({path:`/home/claude/pv-${name}-hero.png`, clip:{x:0,y:0,width:W,height:H}})
  const v = await p.evaluate(()=>{const v=document.querySelector('.scrub-video');return {cls:document.querySelector('.scrub-stage').className, ct:+(v.currentTime||0).toFixed(2), vw:v.videoWidth}})
  // 本文（data-rise が見えているか）
  let y = Math.round(range + H*0.2)
  await p.evaluate(v=>window.scrollTo(0,v), y); await p.waitForTimeout(1500)
  await p.screenshot({path:`/home/claude/pv-${name}-body.png`, clip:{x:0,y:0,width:W,height:H}})
  const risen = await p.evaluate(()=>{
    const all=[...document.querySelectorAll('[data-rise]')]
    const vis = all.filter(e=>{const r=e.getBoundingClientRect(); return r.top<innerHeight&&r.bottom>0})
    return { total: all.length, visibleNow: vis.length, visibleWithIn: vis.filter(e=>e.classList.contains('in')).length,
             childOpacity: vis.map(e=>e.firstElementChild?+getComputedStyle(e.firstElementChild).opacity:null) }
  })
  console.log(name, JSON.stringify(v), JSON.stringify(risen))
}
await b.close()
