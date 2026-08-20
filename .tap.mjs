import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true })
await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
const p = await ctx.newPage()
await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2000)
console.log(JSON.stringify(await p.evaluate(()=>{
  const out=[]
  document.querySelectorAll('a,button,[role="button"],summary,select').forEach(el=>{
    const r=el.getBoundingClientRect()
    if(r.width<2||r.height<2) return
    if(r.height<44||r.width<24) out.push({t:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,20), w:Math.round(r.width), h:Math.round(r.height), cls:el.className.toString().slice(0,50)})
  })
  return out
}), null, 1))
await b.close()
