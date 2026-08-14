import Link from 'next/link'
import { BRAND } from '@/lib/site'

/**
 * 認証まわり（ログイン/登録/パスワード再設定）で使うブランド表記。
 * 表記ゆれを防ぐため lib/site.ts の BRAND を唯一の出典にする。
 */
export function BrandWordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="brand-mark text-2xl" aria-label={BRAND.full}>
      {BRAND.name}
      <span
        className="ember-text"
        style={{ fontSize: '0.55em', letterSpacing: '0.2em', marginLeft: '0.45em' }}
      >
        {BRAND.nameEn}
      </span>
    </Link>
  )
}
