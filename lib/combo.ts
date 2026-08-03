// Combo（組み合わせ）ユーティリティ
// Combo = フレーバーの「種類」の集合。割合・順番・重複は無視する。
// DB の combo_key と同じ正規化ルールで生成すること。

type FlavorLike = { brand: string | null; name: string }

export function flavorKey(brand: string | null, name: string): string {
  const b = (brand ?? '').trim()
  const n = name.trim()
  return `${b}|${n}`.toLowerCase()
}

function normFlavor(brand: string | null, name: string): string {
  return flavorKey(brand, name)
}

/** フレーバー集合から combo_key を生成（DB のバックフィルSQLと一致させる） */
export function comboKey(flavors: FlavorLike[]): string {
  const set = [...new Set(flavors.map((f) => normFlavor(f.brand, f.name)).filter((k) => k !== '|'))]
  set.sort()
  return set.join(' + ')
}

/** URL 用スラッグ（combo_key をそのままエンコード） */
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
