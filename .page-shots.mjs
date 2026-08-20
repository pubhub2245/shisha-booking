import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
// デスクトップ：ヒーローの下（本文側）
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900} })
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2500)
  const h = await p.evaluate(()=>document.querySelector('.scrub').getBoundingClientRect().height)
  await p.evaluate(y=>window.scrollTo(0,y), Math.round(h))
  await p.waitForTimeout(900)
  await p.screenshot({path:'/home/claude/scrub/body1.png', clip:{x:0,y:0,width:1440,height:900}})
  await p.evaluate(y=>window.scrollTo(0,y), Math.round(h+900))
  await p.waitForTimeout(600)
  await p.screenshot({path:'/home/claude/scrub/body2.png', clip:{x:0,y:0,width:1440,height:900}})
  await ctx.close()
}
// スマホ：静止ヒーロー
{
  const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 })
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2200)
  const req = []
  p.on('request', r => req.push(r.url()))
  await p.screenshot({path:'/home/claude/scrub/mobile.png', clip:{x:0,y:0,width:390,height:844}})
  await p.evaluate(()=>window.scrollTo(0,700)); await p.waitForTimeout(500)
  await p.screenshot({path:'/home/claude/scrub/mobile2.png', clip:{x:0,y:0,width:390,height:844}})
  const gotVideo = req.some(u=>/hero-scrub/.test(u))
  console.log('mobile requested video:', gotVideo)
  await ctx.close()
}
// 動きが苦手な設定
{
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' })
  await ctx.addCookies([{name:'age_ok',value:'1',url:'http://localhost:3000'}])
  const p = await ctx.newPage()
  const req = []
  p.on('request', r => req.push(r.url()))
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'}); await p.waitForTimeout(2200)
  await p.screenshot({path:'/home/claude/scrub/reduced.png', clip:{x:0,y:0,width:1440,height:900}})
  console.log('reduced requested video:', req.some(u=>/hero-scrub/.test(u)))
  await ctx.close()
}
await b.close()
