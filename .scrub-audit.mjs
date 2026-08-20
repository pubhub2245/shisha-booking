/**
 * スクロール駆動ヒーローを、実際にスクロールして測る。
 *
 * 1) 各帯の見えている山で撮る（目視用）
 * 2) フリック試験：120/240/360px の刻みで、どの帯も読める時間があるか
 * 3) 最悪ピクセルのコントラスト：文字を消したページを撮り、
 *    文字の箱の中の一番きつい点との比を出す
 */
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import fs from 'fs'

const URL = 'http://localhost:3000/'
const EXE = '/opt/pw-browsers/chromium'
const OUT = '/home/claude/scrub'
fs.mkdirSync(OUT, { recursive: true })

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)

const VIEW = process.argv[2] === 'mobile'
  ? { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }
  : { name: 'desktop', width: 1440, height: 900 }
console.log('=== ' + VIEW.name + ' ===')

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] })
const ctx = await browser.newContext({
  viewport: { width: VIEW.width, height: VIEW.height },
  isMobile: VIEW.isMobile, hasTouch: VIEW.hasTouch,
})
await ctx.addCookies([{ name: 'age_ok', value: '1', url: 'http://localhost:3000' }])
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1600)

const meta = await page.evaluate(() => {
  const root = document.querySelector('.scrub')
  const bands = [...document.querySelectorAll('.beat')].map((b) => ({ a: +b.dataset.a, b: +b.dataset.b }))
  return {
    hasScrub: !!root,
    heroPx: root ? root.getBoundingClientRect().height : 0,
    docH: document.documentElement.scrollHeight,
    bands,
    posterSet: !!document.querySelector('.scrub-poster')?.style.backgroundImage,
  }
})
console.log('hero:', JSON.stringify(meta))
if (!meta.hasScrub) { console.log('スクラブが出ていない'); await browser.close(); process.exit(1) }

const range = meta.heroPx - VIEW.height

// ---------- 1) 各帯の山で撮る ----------
const peaks = meta.bands.map((b, i) => ({ i, p: (b.a + b.b) / 2 }))
for (const { i, p } of peaks) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(p * range))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${VIEW.name}-beat${i}.png`, clip: { x: 0, y: 0, width: VIEW.width, height: VIEW.height } })
}

// ---------- 3) 最悪ピクセル ----------
let bad = 0
for (const { i, p } of peaks) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(p * range))
  await page.waitForTimeout(900)
  const items = await page.evaluate((idx) => {
    const beat = document.querySelectorAll('.beat')[idx]
    const out = []
    const walk = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const r = document.createRange(); r.selectNodeContents(n)
          for (const b of r.getClientRects()) {
            if (b.width < 4 || b.height < 4) continue
            const cs = getComputedStyle(el.nodeType === 1 ? el : el.parentElement)
            // 自前の不透明な地を持つもの（塗りボタン等）は写真の上に居ない。
            // ここで測ると地を剥がして写真と比べてしまい、必ず偽の不合格になる
            let opaque = false
            // 遡るのは帯の中だけ。ここを越えると器の地（不透明）に当たって全部除外される
            for (let a = el; a && a !== beat; a = a.parentElement) {
              const bg = getComputedStyle(a).backgroundColor
              const m = bg.match(/[\d.]+/g)
              if (m && (m.length < 4 || +m[3] > 0.85)) { opaque = true; break }
            }
            if (opaque) continue
            out.push({ text: n.textContent.trim().slice(0, 18), color: cs.color, px: parseFloat(cs.fontSize), weight: +cs.fontWeight || 400, x: b.x, y: b.y, w: b.width, h: b.height })
          }
        } else if (n.nodeType === 1) walk(n)
      }
    }
    walk(beat)
    return out
  }, i)

  const hideId = await page.addStyleTag({ content: `.beat, .beat * { color: transparent !important; text-shadow: none !important }` })
  await page.waitForTimeout(250)
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: VIEW.width, height: VIEW.height } })
  await page.evaluate((el) => el.remove(), hideId)
  const png = PNG.sync.read(buf)
  const at = (x, y) => { const k = ((Math.round(y) * png.width) + Math.round(x)) << 2; return L(png.data[k], png.data[k + 1], png.data[k + 2]) }

  console.log(`\n--- 帯 ${i} (p=${p.toFixed(2)}) ---`)
  for (const it of items) {
    const [r, g, b] = parse(it.color)
    const fg = L(r, g, b)
    let worst = Infinity, wx = 0, wy = 0
    const sx = Math.max(1, it.w / 40), sy = Math.max(1, it.h / 8)
    for (let y = it.y + 1; y < it.y + it.h - 1; y += sy) {
      for (let x = it.x + 1; x < it.x + it.w - 1; x += sx) {
        if (y >= VIEW.height || x >= VIEW.width || y < 0 || x < 0) continue
        const c = ratio(fg, at(x, y))
        if (c < worst) { worst = c; wx = x; wy = y }
      }
    }
    const large = it.px >= 24 || (it.px >= 18.66 && it.weight >= 700)
    const need = large ? 3 : 4.5
    const ok = worst >= need
    if (!ok) bad++
    console.log(`${ok ? 'OK ' : 'NG '} ${worst.toFixed(2)} (要 ${need}) ${Math.round(it.px)}px @${Math.round(wx)},${Math.round(wy)}  "${it.text}"`)
  }
}

// ---------- 2) フリック試験 ----------
// 滑らかスクロール（html { scroll-behavior: smooth }）は切る。
// 実際のホイールやフリックは瞬間移動なので、それを付けたまま測ると
// 直前の慣性が次の刻みに乗って、読める回数を実際より少なく数えてしまう。
await page.addStyleTag({ content: 'html { scroll-behavior: auto !important }' })
console.log('\n=== フリック試験（1刻みごとに各帯の不透明度） ===')
for (const step of [120, 240, 360]) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  const seen = meta.bands.map(() => 0)
  const total = Math.ceil(range / step)
  for (let n = 0; n <= total; n++) {
    await page.evaluate((s) => window.scrollBy(0, s), step)
    await page.waitForTimeout(260)
    const ops = await page.evaluate(() => [...document.querySelectorAll('.beat')].map((b) => +getComputedStyle(b).opacity))
    ops.forEach((o, i) => { if (o > 0.92) seen[i]++ })
  }
  console.log(`${step}px 刻み（全${total}回）: 各帯が完全に見えていた回数 = ${seen.join(', ')}`)
  if (step === 120 && seen.some((s) => s < 5)) { console.log('  → 120px で5回に満たない帯がある（読み切れない）'); bad++ }
  if (seen.some((s) => s === 0)) { console.log('  → 一度も完全に見えない帯がある（飛ばされる）'); bad++ }
}

console.log('\nconsole errors:', errors.filter((e) => !/ERR_TUNNEL|font/i.test(e)).length, errors.slice(0, 3))
console.log('不合格:', bad)
await browser.close()
process.exit(bad ? 1 : 0)
