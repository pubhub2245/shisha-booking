/** スマホ幅で、指で押す物が44px未満になっていないかだけを見る。 */
import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'
const PAGES = ['/', '/flavors', '/national', '/ranking', '/shops', '/guide', '/about', '/theme',
  '/search', '/areas', '/ideas', '/founders', '/for-shops', '/login', '/signup',
  '/legal/terms', '/bowl/funnel', '/hms/lotus']
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
await ctx.addCookies([{ name: 'age_ok', value: '1', url: BASE }])
const p = await ctx.newPage()
let total = 0
for (const path of PAGES) {
  try { await p.goto(BASE + path, { waitUntil: 'networkidle', timeout: 40000 }) } catch { continue }
  await p.waitForTimeout(1000)
  const small = await p.evaluate(() => {
    const out = []
    document.querySelectorAll('a,button,input,select,summary,[role="button"]').forEach((el) => {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      // 文章の中のリンクは行の高さで決まるので対象外（本文を読ませるための物）
      if (el.closest('p, li, .prose')) return
      if (r.height < 44) out.push({ t: (el.textContent || '').trim().slice(0, 16) || el.tagName, h: Math.round(r.height) })
    })
    return out
  })
  total += small.length
  console.log(`${path.padEnd(18)} ${small.length === 0 ? 'OK' : small.length + ' 件  ' + small.slice(0, 5).map(s => `"${s.t}"(${s.h})`).join(' ')}`)
}
console.log('\n合計 ' + total)
await b.close()
