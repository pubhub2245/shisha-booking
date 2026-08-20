import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
for (const [name, opt] of [
  ['reduced motion', { viewport:{width:1440,height:900}, reducedMotion:'reduce' }],
  ['寝かせたスマホ', { viewport:{width:844,height:390}, isMobile:true, hasTouch:true }],
  ['スマホ縦', { viewport:{width:390,height:844}, isMobile:true, hasTouch:true }],
  ['PC', { viewport:{width:1440,height:900} }],
]) {
  const ctx = await b.newContext(opt)
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  const req=[]; p.on('request', r=>req.push(r.url()))
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2500)
  const shown = await p.evaluate(()=>({
    scrub: document.querySelector('.scrub') ? getComputedStyle(document.querySelector('.scrub')).display : '-',
    still: document.querySelector('.still') ? getComputedStyle(document.querySelector('.still')).display : '-',
  }))
  console.log(name, '| scrub:', shown.scrub, '| still:', shown.still, '| 取得:', req.filter(u=>/hero-scrub/.test(u)).map(u=>u.split('/').pop()).join(',')||'なし')
  await ctx.close()
}
await b.close()
