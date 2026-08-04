import Link from 'next/link'
import { ForgotForm } from './forgot-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'パスワード再設定 — MixHub' }

export default function ForgotPage() {
  return (
    <div className="wrap max-w-md py-16">
      <Link href="/" className="brand-mark text-2xl">
        Mix<span className="ember-text">Hub</span>
      </Link>
      <h1 className="mt-6 text-3xl" style={{ fontWeight: 800 }}>パスワードをお忘れですか？</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        登録したメールアドレスに、パスワード再設定用のリンクをお送りします。
      </p>
      <ForgotForm />
    </div>
  )
}
