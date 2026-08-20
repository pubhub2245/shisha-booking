import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
const p = await ctx.newPage()
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()) })
await p.goto('http://localhost:3000/', { waitUntil:'networkidle' })
await p.waitForTimeout(4000)
const st = async () => p.evaluate(() => {
  const v = document.querySelector('.scrub-video')
  const s = document.querySelector('.scrub-stage')
  return { cls: s.className, ct: v?.currentTime, dur: v?.duration, rs: v?.readyState,
           vw: v?.videoWidth, vh: v?.videoHeight, srcKind: (v?.src||'').slice(0,5),
           posterOp: getComputedStyle(document.querySelector('.scrub-poster')).opacity,
           videoOp: getComputedStyle(v).opacity }
})
console.log('t=0   ', JSON.stringify(await st()))
const range = await p.evaluate(() => document.querySelector('.scrub').getBoundingClientRect().height - innerHeight)
for (const f of [0.2, 0.55, 0.9]) {
  await p.evaluate(y => window.scrollTo(0, y), Math.round(f*range))
  await p.waitForTimeout(1200)
  console.log('p='+f+' ', JSON.stringify(await st()))
}
await b.close()
