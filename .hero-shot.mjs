import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] })
for (const [name, vp, mob] of [['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob?2:1 })
  await ctx.addCookies([{ name:'age_ok', value:'1', url:'http://localhost:3000' }])
  const p = await ctx.newPage()
  await p.goto('http://localhost:3000/', { waitUntil:'networkidle' })
  await p.waitForTimeout(2500)
  await p.screenshot({ path:`/home/claude/hero-${name}.png`, clip:{x:0,y:0,width:vp.width,height:Math.min(vp.height,900)} })
  await ctx.close()
}
await b.close()
