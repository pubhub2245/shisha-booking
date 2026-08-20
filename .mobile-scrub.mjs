import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
// スマホ：スクラブが出るか、どの資産を取るか
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 })
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  const req=[]; p.on('request', r=>req.push(r.url()))
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(3500)
  const st = async () => p.evaluate(()=>{ const v=document.querySelector('.scrub-video'); const s=document.querySelector('.scrub-stage')
    return s? {cls:s.className, ct:+(v.currentTime||0).toFixed(2), dur:v.duration} : 'スクラブ無し' })
  console.log('mobile t=0 ', JSON.stringify(await st()))
  const range = await p.evaluate(()=>document.querySelector('.scrub').getBoundingClientRect().height - innerHeight)
  for (const [n,f] of [['a',0.15],['b',0.5],['c',0.9]]) {
    await p.evaluate(y=>window.scrollTo(0,y), Math.round(f*range)); await p.waitForTimeout(1200)
    await p.screenshot({path:`/home/claude/scrub/mv-${n}.png`, clip:{x:0,y:0,width:390,height:844}})
  }
  console.log('mobile p=0.9', JSON.stringify(await st()))
  console.log('取った資産:', req.filter(u=>/hero-/.test(u)).map(u=>u.split('/').pop()).join(', '))
  console.log('errors:', errs.filter(e=>!/TUNNEL|font/i.test(e)).length)
  await ctx.close()
}
await b.close()
