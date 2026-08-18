// フレーバーのキー。
//
// 煙道が扱うのは「1つのフレーバーを、どう作るか」なので、作り方に紐づくフレーバーは常に1つ。
// その結果 mixes.combo_key はそのままフレーバーのキー（`brand|name` の小文字）になる。
// combo_key という列名は旧モデル（フレーバーの組み合わせ＝ミックス）の名残で、
// 既存データと RPC がこの名前で動いているため、列名だけそのまま使っている。
//
// 旧データには複数フレーバーの記録が残っており、その combo_key だけが ' + ' を含む。

type FlavorLike = { brand: string | null; name: string }

export function flavorKey(brand: string | null, name: string): string {
  const b = (brand ?? '').trim()
  const n = name.trim()
  return `${b}|${n}`.toLowerCase()
}

/**
 * フレーバーから combo_key を生成する。
 * 1つなら flavorKey と同じ。旧データとの互換のため、複数渡されたときは昇順連結する。
 */
export function comboKey(flavors: FlavorLike[]): string {
  const set = [...new Set(flavors.map((f) => flavorKey(f.brand, f.name)).filter((k) => k !== '|'))]
  set.sort()
  return set.join(' + ')
}

/** URL 用スラッグ（combo_key をそのままエンコード）。旧 /combo/[slug] の互換で使う */
export function comboSlug(key: string): string {
  return encodeURIComponent(key)
}

export function comboKeyFromSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

/** 旧モデルの複数フレーバー記録か（フレーバーのページには並べない） */
export function isLegacyMultiFlavorKey(key: string | null | undefined): boolean {
  return !!key && key.includes(' + ')
}
