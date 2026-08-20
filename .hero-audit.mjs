/**
 * ヒーローの「写真の上の文字」を実測する。
 *
 * 宣言された background-color と比べても意味がない（後ろにあるのは写真）ので、
 * 文字を消した状態のヒーローを撮り、各文字ブロックの箱の中の
 * 実際のピクセルを見て、最悪の1点との比を出す。
 */
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import fs from 'fs'

const URL = 'http://localhost:3000/'
const EXE = '/opt/pw-browsers/chromium'

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
]

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
let bad = 0

for (const v of VIEWS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    isMobile: v.isMobile, hasTouch: v.hasTouch,
    deviceScaleFactor: v.deviceScaleFactor ?? 1,
  })
  await ctx.addCookies([{ name: 'age_ok', value: '1', url: 'http://localhost:3000' }])
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // 文字の箱と色を先に取る
  const items = await page.evaluate(() => {
    const root = document.querySelector('.hero-room')
    if (!root) return []
    const out = []
    const walk = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const r = document.createRange(); r.selectNodeContents(n)
          for (const b of r.getClientRects()) {
            if (b.width < 4 || b.height < 4) continue
            const cs = getComputedStyle(el)
            out.push({
              text: n.textContent.trim().slice(0, 22),
              color: cs.color,
              px: parseFloat(cs.fontSize),
              weight: Number(cs.fontWeight) || 400,
              x: b.x, y: b.y, w: b.width, h: b.height,
            })
          }
        } else if (n.nodeType === 1) walk(n)
      }
    }
    walk(root)
    return out
  })

  // 文字と枠線だけ透明にして、背後だけを撮る
  await page.addStyleTag({
    content: `.hero-room, .hero-room * { color: transparent !important; text-shadow: none !important; border-color: transparent !important; }`,
  })
  await page.waitForTimeout(300)
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: v.width, height: Math.min(v.height, 900) } })
  const png = PNG.sync.read(buf)
  const s = v.deviceScaleFactor ?? 1

  const at = (x, y) => {
    const i = ((Math.round(y * s) * png.width) + Math.round(x * s)) << 2
    return L(png.data[i], png.data[i + 1], png.data[i + 2])
  }

  console.log(`\n=== ${v.name} (${v.width}x${v.height}) ===`)
  for (const it of items) {
    const [r, g, b] = parse(it.color)
    const fg = L(r, g, b)
    // 箱の中を格子で舐めて、一番きつい点を採る
    let worst = Infinity, wx = 0, wy = 0
    const stepX = Math.max(1, it.w / 40), stepY = Math.max(1, it.h / 8)
    for (let y = it.y + 1; y < it.y + it.h - 1; y += stepY) {
      for (let x = it.x + 1; x < it.x + it.w - 1; x += stepX) {
        if (y * s >= png.height || x * s >= png.width) continue
        const c = ratio(fg, at(x, y))
        if (c < worst) { worst = c; wx = x; wy = y }
      }
    }
    const large = it.px >= 24 || (it.px >= 18.66 && it.weight >= 700)
    const need = large ? 3 : 4.5
    const ok = worst >= need
    if (!ok) bad++
    console.log(`${ok ? 'OK ' : 'NG '} ${worst.toFixed(2)} (要 ${need}) ${it.px}px/${it.weight} @${Math.round(wx)},${Math.round(wy)}  "${it.text}"`)
  }
  fs.writeFileSync(`/home/claude/hero-bg-${v.name}.png`, buf)
  await ctx.close()
}

await browser.close()
console.log(`\n不合格: ${bad}`)
process.exit(bad ? 1 : 0)
