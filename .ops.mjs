import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true })
await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
const p = await ctx.newPage()
await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2500)
const range = await p.evaluate(()=>document.querySelector('.scrub').getBoundingClientRect().height - innerHeight)
console.log('range', range)
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(600)
for (let n=0;n<12;n++){
  await p.evaluate(()=>window.scrollBy(0,120)); await p.waitForTimeout(300)
  const r = await p.evaluate(()=>({y:Math.round(scrollY), ops:[...document.querySelectorAll('.beat')].map(b=>(+getComputedStyle(b).opacity).toFixed(2))}))
  console.log(r.y, r.ops.join(' '))
}
await b.close()
