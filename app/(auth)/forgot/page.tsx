import Link from 'next/link'
import { ForgotForm } from './forgot-form'
import { EMAIL_ENABLED } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'パスワード再設定 — MixHub' }

export default function ForgotPage() {
  return (
    <div className="wrap max-w-md py-16">
      <Link href="/" className="brand-mark text-2xl">
        Mix<span className="ember-text">Hub</span>
      </Link>
      <h1 className="mt-6 text-3xl" style={{ fontWeight: 800 }}>パスワードをお忘れですか？</h1>
      {EMAIL_ENABLED ? (
        <>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            登録したメールアドレスに、パスワード再設定用のリンクをお送りします。
          </p>
          <ForgotForm />
        </>
      ) : (
        <>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            現在、メールでのパスワード再設定はご利用いただけません。お手数ですが運営までお問い合わせください。
          </p>
          <Link href="/login" className="btn btn-ghost mt-6">ログインに戻る</Link>
        </>
      )}
    </div>
  )
}
