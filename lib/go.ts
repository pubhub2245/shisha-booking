// 送客リンク（/go）のURLを組み立てるヘルパー。
// 実リンクへ飛ばす前にクリックを計測する（CPA/アフィリエイトの土台）。

export type GoMeta = { f?: string | null; m?: string | null; s?: string | null }

/** target（購入/来店リンク）を /go 経由の計測URLに変換。null は null のまま。 */
export function goHref(target: string | null | undefined, meta: GoMeta = {}): string | null {
  if (!target) return null
  const p = new URLSearchParams({ u: target })
  if (meta.f) p.set('f', meta.f)
  if (meta.m) p.set('m', meta.m)
  if (meta.s) p.set('s', meta.s)
  return `/go?${p.toString()}`
}
