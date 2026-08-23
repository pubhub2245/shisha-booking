import Link from 'next/link'
import { BRAND } from '@/lib/site'

/**
 * 認証まわり（ログイン/登録/パスワード再設定）で使うブランド表記。
 * 表記ゆれを防ぐため lib/site.ts の BRAND を唯一の出典にする。
 *
 * ヘッダーと同じ「字の左に一本の煙」(.mark) を使う。
 * ここだけ旧い書き方が残っていて、ログイン画面のロゴがヘッダーと違って見えていた。
 * 押せる高さは 44px を切らないようにしてある（指で押す物なので）。
 */
export function BrandWordmark({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="mark"
      aria-label={BRAND.full}
      style={{ minHeight: 44, transform: 'scale(1.15)', transformOrigin: 'left center' }}
    >
      <span className="mark-flue" aria-hidden />
      <span className="flex items-baseline gap-2">
        <span className="mark-name">{BRAND.name}</span>
        <span className="mark-en">{BRAND.nameEn}</span>
      </span>
    </Link>
  )
}
