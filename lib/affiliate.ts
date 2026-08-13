// アフィリエイトタグの一元管理。
// 実際の Amazon アソシエイト ID は環境変数 AMAZON_ASSOC_TAG で設定する。
// 未設定時はプレースホルダ 'endoh-22'（本番では必ず差し替えること）。
export const AFFILIATE_TAG = process.env.AMAZON_ASSOC_TAG || 'endoh-22'

// 本番で未設定のままだと、全リンクがプレースホルダのタグになり成果が誤帰属する。静かな事故を防ぐため警告する。
if (!process.env.AMAZON_ASSOC_TAG && process.env.NODE_ENV === 'production') {
  console.warn('[affiliate] AMAZON_ASSOC_TAG が未設定です。プレースホルダ "endoh-22" を使用中——アフィリエイト成果が正しく計上されません。')
}

const AMAZON_HOST = /(^|\.)amazon\.(co\.jp|com|co\.uk|de|fr|it|es|ca)$/i

/**
 * 保存済み URL に対して、表示時にアソシエイト ID を付与/上書きする。
 * Amazon 系ドメインのみ `tag` を差し替え、それ以外の購入リンクはそのまま返す。
 * ユーザー投稿の URL も含めて常に自社タグに正規化される。
 */
export function withAffiliateTag(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (AMAZON_HOST.test(u.hostname)) {
      u.searchParams.set('tag', AFFILIATE_TAG)
      return u.toString()
    }
    return url
  } catch {
    return url
  }
}
