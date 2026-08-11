#!/usr/bin/env node
// フレーバー自動取得スクリプト（ネットの信頼できるソースから）
//
// 多くのシーシャ通販は Shopify で動いており、コレクションの JSON API
//   https://<shop>/collections/<handle>/products.json
// から商品名（＝フレーバー名）を安定して取得できます。
// このスクリプトはそれを取得・整形し、「ブランド, 名前」の行を出力します。
// 出力を確認して、アプリの /flavors/new の「まとめて追加」に貼り付けてください。
//
// 使い方（ネットワーク制限のない環境＝あなたのPCで）:
//   node scripts/fetch-flavors.mjs > flavors.txt
//   # flavors.txt を開いて中身を確認・修正 → /flavors/new に貼り付け
//
// ※ 実行前に SOURCES を確認してください。ショップのURL/handle は変わることがあります。
//   コレクションのURL末尾に /products.json を付けると中身を確認できます。

// ---- 取得元（信頼できる日本の通販／Shopify コレクション）----
// brand: 図鑑に登録するブランド名（大文字推奨）
// url:   そのブランドのコレクションの products.json
const SOURCES = [
  { brand: 'AL FAKHER', url: 'https://shisha-oroshi.myshopify.com/collections/al-fakher/products.json' },
  // 例）他ブランドも同様に追加できます。ショップの各ブランドコレクションを開き、
  //     URL 末尾に /products.json を付けたものを貼ってください。
  // { brand: 'ADALYA',  url: 'https://<shop>/collections/adalya/products.json' },
  // { brand: 'FUMARI',  url: 'https://<shop>/collections/fumari/products.json' },
]

// タイトルからフレーバー名だけを取り出すための除去パターン
const NOISE = [
  /水たばこ/gi, /水タバコ/gi, /シーシャ/gi, /フレーバー/gi, /たばこ/gi,
  /\b\d+\s?(g|kg|ｇ)\b/gi, /\d+\s?(g|kg|ｇ)/gi,
  /【[^】]*】/g, /\([^)]*\)/g, /（[^）]*）/g,
]

function cleanTitle(title, brand) {
  let s = String(title)
  // ブランド名（英・カナ両方ありうる）を先頭から除去
  const brandVariants = [brand, brand.toLowerCase(), brand.replace(/\s+/g, '')]
  for (const b of brandVariants) {
    s = s.replace(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
  }
  for (const re of NOISE) s = s.replace(re, ' ')
  s = s.replace(/[|｜/／]/g, ' ').replace(/\s+/g, ' ').trim()
  // 前後の記号やハイフンを掃除
  s = s.replace(/^[-–—・,、\s]+|[-–—・,、\s]+$/g, '').trim()
  return s
}

async function fetchAll(url) {
  const products = []
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}limit=250&page=${page}`)
    if (!res.ok) break
    const json = await res.json()
    const items = json.products ?? []
    if (items.length === 0) break
    products.push(...items)
    if (items.length < 250) break
  }
  return products
}

async function main() {
  const seen = new Set()
  const out = []
  for (const src of SOURCES) {
    try {
      const products = await fetchAll(src.url)
      for (const p of products) {
        const name = cleanTitle(p.title, src.brand)
        if (!name || name.length > 80) continue
        const key = `${src.brand}|${name}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push(`${src.brand}, ${name}`)
      }
      process.stderr.write(`✓ ${src.brand}: ${products.length}件取得\n`)
    } catch (e) {
      process.stderr.write(`✗ ${src.brand}: 取得失敗 (${e.message})\n`)
    }
  }
  // 標準出力に「ブランド, 名前」を出力（> flavors.txt でファイル化）
  process.stdout.write(out.join('\n') + '\n')
  process.stderr.write(`\n合計 ${out.length} 件。内容を確認して /flavors/new に貼り付けてください。\n`)
}

main()
