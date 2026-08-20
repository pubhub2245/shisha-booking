import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
for (const [name,opt] of [['pc',{viewport:{width:1440,height:900}}],['sp',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]) {
  const p = await (await b.newContext(opt)).newPage()
  p.on('pageerror', e=>console.log(name,'PAGEERR', e.message))
  await p.goto('file:///home/claude/endo-preview.html'); await p.waitForTimeout(3000)
  const H=opt.viewport.height, W=opt.viewport.width
  const doc = await p.evaluate(()=>document.documentElement.scrollHeight)
  // 上から下まで送る
  for (let y=0; y<doc; y+=Math.round(H*0.6)) { await p.evaluate(v=>window.scrollTo(0,v), y); await p.waitForTimeout(320) }
  await p.waitForTimeout(1200)
  const st = await p.evaluate(()=>{
    const els=[...document.querySelectorAll('[data-rise]')]
    return { rise: els.filter(e=>e.classList.contains('in')).length + '/' + els.length,
             axesHeat: !!document.querySelector('.axes')?.hasAttribute('data-inview'),
             video: document.querySelector('.scrub-stage').className }
  })
  console.log(name, JSON.stringify(st))
  // 撮る：本文の頭 / 五つの帯 / 煙道とは
  const range = await p.evaluate(()=>document.querySelector('.scrub').getBoundingClientRect().height - innerHeight)
  const spots = [ ['body1', range + H*0.15], ['body2', range + H*1.0], ['body3', doc - H*1.6] ]
  for (const [n,y] of spots) {
    await p.evaluate(v=>window.scrollTo(0,v), Math.round(y)); await p.waitForTimeout(900)
    await p.screenshot({path:`/home/claude/pv-${name}-${n}.png`, clip:{x:0,y:0,width:W,height:H}})
  }
}
await b.close()
