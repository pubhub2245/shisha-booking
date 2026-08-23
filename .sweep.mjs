/**
 * 暗い地一本にした影響を、全ページで測る。
 * 明暗の切り替えはもう無いので1回だけ回す。
 */
import { chromium } from 'playwright'
import fs from 'fs'
const BASE = 'http://localhost:3000'
const OUT = '/home/claude/sweep'
fs.mkdirSync(OUT, { recursive: true })

const PAGES = ['/', '/flavors', '/flavors/new', '/national', '/ranking', '/shops', '/guide', '/about',
  '/theme', '/search', '/areas', '/timeline', '/ideas', '/founders', '/for-shops',
  '/legal/privacy', '/legal/terms', '/legal/tokushoho', '/login', '/signup', '/forgot',
  '/post', '/record', '/shelf', '/mypage', '/notifications',
  '/bowl/funnel', '/hms/lotus']

const AUDIT = () => {
  const lum = c => { const [r, g, b] = c; const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b) }
  const parse = s => { const m = String(s).match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null }
  const alphaOf = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return 1; const p = m[1].split(',').map(x => parseFloat(x)); return p.length > 3 ? p[3] : 1 }
  const bgOf = el => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; const p = parse(c); if (p && alphaOf(c) > 0.9) return p; e = e.parentElement } return parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255] }
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return +(((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(2)) }
  const fails = [], seen = new Set()
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length > 0) return
    const txt = (el.textContent || '').trim(); if (!txt) return
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return
    const fg = parse(cs.color); if (!fg || alphaOf(cs.color) < 0.5) return
    let g = el, onGrad = false
    for (let i = 0; i < 4 && g; i++, g = g.parentElement) { if (/gradient/.test(getComputedStyle(g).backgroundImage)) { onGrad = true; break } }
    if (onGrad) return
    const size = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400
    const large = size >= 24 || (size >= 18.66 && w >= 700)
    const bg = bgOf(el), rr = ratio(fg, bg), need = large ? 3 : 4.5
    const key = cs.color + '|' + cs.fontSize + '|' + w + '|' + bg.join(',')
    if (rr < need && !seen.has(key)) { seen.add(key); fails.push({ t: txt.slice(0, 24), fg: cs.color, bg: 'rgb(' + bg.join(',') + ')', px: Math.round(size), w, ratio: rr, need }) }
  })
  const small = []
  document.querySelectorAll('a,button,input,select,summary,[role="button"]').forEach(el => {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && r.height < 44) small.push({ t: (el.textContent || '').trim().slice(0, 14), h: Math.round(r.height), inProse: !!el.closest('p,li') })
  })
  // 和柄ユーティリティが残っているか（新規には使わない決まり）
  const legacy = ['pattern-seigaiha', 'pattern-asanoha', 'kaisen', 'seal-stamp', 'washi', 'paper'].filter(c => document.querySelector('.' + c))
  // 絵文字がUIに残っているか
  const emoji = []
  document.querySelectorAll('a,button,h1,h2,h3,summary,[role="tab"]').forEach(el => {
    const t = (el.textContent || '')
    const m = t.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu)
    if (m) emoji.push(t.trim().slice(0, 20))
  })
  return {
    contrastFails: fails, contrastFailCount: fails.length,
    tapUnder44: small.length, tapSamples: small.slice(0, 6),
    legacyPatterns: legacy, emojiInUI: [...new Set(emoji)].slice(0, 10),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    sideways: document.documentElement.scrollWidth > window.innerWidth + 1,
  }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const results = {}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addCookies([{ name: 'age_ok', value: '1', url: BASE }])
const page = await ctx.newPage()
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 140)))
for (const p of PAGES) {
  try { await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 40000 }) }
  catch { try { await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 25000 }) } catch (e) { results[p] = { error: String(e).slice(0, 100) }; continue } }
  await page.waitForTimeout(1400)
  const r = await page.evaluate(AUDIT)
  r.consoleErrors = errors.splice(0)
  r.url = page.url().replace(BASE, '')
  results[p] = r
  await page.screenshot({ path: `${OUT}/${(p.replace(/\//g, '_') || '_home')}.png` })
}
await ctx.close()
await browser.close()
fs.writeFileSync(`${OUT}/sweep.json`, JSON.stringify(results, null, 1))
const rows = []
for (const [k, v] of Object.entries(results)) {
  if (v.error) { rows.push(`${k.padEnd(20)} ERROR ${v.error}`); continue }
  const flag = []
  if (v.contrastFailCount) flag.push(`コントラスト不合格 ${v.contrastFailCount}`)
  if (v.tapUnder44) flag.push(`タップ<44px ${v.tapUnder44}`)
  if (v.legacyPatterns.length) flag.push(`旧和柄 ${v.legacyPatterns.join(',')}`)
  if (v.emojiInUI.length) flag.push(`絵文字 ${v.emojiInUI.length}`)
  if (v.consoleErrors.length) flag.push(`console ${v.consoleErrors.length}`)
  if (v.sideways) flag.push('横はみ出し')
  rows.push(`${k.padEnd(20)} ${v.url !== k ? '→' + v.url + ' ' : ''}${flag.length ? flag.join(' / ') : 'OK'}`)
}
console.log(rows.join('\n'))
