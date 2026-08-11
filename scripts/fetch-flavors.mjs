#!/usr/bin/env node
// フレーバー自動取得スクリプト（ネットの信頼できるソース＝Shopify通販から）
//
// 多くの日本のシーシャ通販は Shopify 製で、次の公開JSONが使えます:
//   - <shop>/collections.json                     … 全コレクション（≒ブランド）一覧
//   - <shop>/collections/<handle>/products.json    … そのブランドの商品（＝フレーバー）
// このスクリプトは SHOPS のドメインを開き、ブランドのコレクションを自動発見して
// 商品名を取得・整形し、「ブランド, 名前」の行を出力します。
//
// 使い方（ネットワーク制限のない環境＝あなたのPCで）:
//   node scripts/fetch-flavors.mjs > flavors.txt
//   # flavors.txt を開いて中身を確認・修正 → アプリの /flavors/new「まとめて追加」に貼り付け
//
// ※ 出力は必ず目視確認してから投入してください（誤情報防止のため）。

// ---- 取得元のショップ（信頼できる日本のシーシャ通販／Shopify）----
// ドメインを足すだけで、その店の全ブランドを自動取得します。
const SHOPS = [
  'https://shisha-oroshi.myshopify.com',
  // 'https://<another-shop>.myshopify.com',
  // 独自ドメインのShopify店もOK（例: 'https://drshisha.jp'）。
]

// ---- 個別指定したいコレクション（任意・SHOPSの自動発見で足りない時だけ）----
const SOURCES = [
  // { brand: 'AL FAKHER', url: 'https://shisha-oroshi.myshopify.com/collections/al-fakher/products.json' },
]

// ブランドとして扱わないコレクション handle（セール・新着など）
const SKIP_HANDLES = new Set([
  'all', 'frontpage', 'sale', 'new', 'new-arrivals', 'featured', 'best', 'bestseller',
  'ranking', 'set', 'sets', 'accessory', 'accessories', 'charcoal', 'goods', 'other',
  'coming-soon', 'sold-out', 'campaign',
])

const NOISE = [
  /水たばこ/gi, /水タバコ/gi, /シーシャ/gi, /フレーバー/gi, /たばこ/gi,
  /\b\d+\s?(g|kg|ｇ)\b/gi, /\d+\s?(g|kg|ｇ)/gi,
  /【[^】]*】/g, /\([^)]*\)/g, /（[^）]*）/g,
]

// handle（例: al-fakher）→ ブランド名（例: AL FAKHER）
function handleToBrand(handle) {
  return handle.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}

function looksLikeBrand(handle) {
  if (SKIP_HANDLES.has(handle)) return false
  if (handle.length < 2) return false
  // 日本語だけの handle はブランドで無いことが多いので除外
  if (!/[a-z0-9]/i.test(handle)) return false
  return true
}

function cleanTitle(title, brand) {
  let s = String(title)
  const variants = [brand, brand.toLowerCase(), brand.replace(/\s+/g, ''), brand.replace(/\s+/g, '-')]
  for (const b of variants) {
    if (!b) continue
    s = s.replace(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
  }
  for (const re of NOISE) s = s.replace(re, ' ')
  s = s.replace(/[|｜/／]/g, ' ').replace(/\s+/g, ' ').trim()
  s = s.replace(/^[-–—・,、\s]+|[-–—・,、\s]+$/g, '').trim()
  return s
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'MixHub-flavor-importer' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchProducts(collectionUrl) {
  const products = []
  for (let page = 1; page <= 20; page++) {
    const sep = collectionUrl.includes('?') ? '&' : '?'
    const json = await getJson(`${collectionUrl}${sep}limit=250&page=${page}`)
    const items = json.products ?? []
    if (items.length === 0) break
    products.push(...items)
    if (items.length < 250) break
  }
  return products
}

async function collect(brand, collectionUrl, seen, out) {
  const products = await fetchProducts(collectionUrl)
  let added = 0
  for (const p of products) {
    const name = cleanTitle(p.title, brand)
    if (!name || name.length > 80) continue
    const key = `${brand}|${name}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(`${brand}, ${name}`)
    added++
  }
  process.stderr.write(`  ✓ ${brand}: ${added}件\n`)
}

async function main() {
  const seen = new Set()
  const out = []

  // 1) ショップからブランドコレクションを自動発見
  for (const shop of SHOPS) {
    process.stderr.write(`# ${shop}\n`)
    let collections = []
    try {
      const json = await getJson(`${shop}/collections.json?limit=250`)
      collections = json.collections ?? []
    } catch (e) {
      process.stderr.write(`  ✗ collections.json 取得失敗 (${e.message})\n`)
      continue
    }
    for (const c of collections) {
      if (!looksLikeBrand(c.handle)) continue
      const brand = handleToBrand(c.handle)
      try {
        await collect(brand, `${shop}/collections/${c.handle}/products.json`, seen, out)
      } catch (e) {
        process.stderr.write(`  ✗ ${brand}: ${e.message}\n`)
      }
    }
  }

  // 2) 個別指定
  for (const src of SOURCES) {
    try {
      await collect(src.brand, src.url, seen, out)
    } catch (e) {
      process.stderr.write(`  ✗ ${src.brand}: ${e.message}\n`)
    }
  }

  process.stdout.write(out.join('\n') + '\n')
  process.stderr.write(`\n合計 ${out.length} 件。内容を確認して /flavors/new「まとめて追加」に貼り付けてください。\n`)
}

main()
