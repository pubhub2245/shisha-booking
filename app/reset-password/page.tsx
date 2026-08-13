import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ResetForm } from './reset-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: '新しいパスワードの設定 — 煙道' }

export default async function ResetPasswordPage() {
  // メールのリンク→/auth/callback で回復セッションが確立された状態で来る
  const user = await getCurrentUser()
  if (!user) redirect('/forgot')

  return (
    <div className="wrap max-w-md py-16">
      <Link href="/" className="brand-mark text-2xl">
        Mix<span className="ember-text">Hub</span>
      </Link>
      <h1 className="mt-6 text-3xl" style={{ fontWeight: 800 }}>新しいパスワードを設定</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        新しいパスワードを入力してください。更新後はそのままログインされます。
      </p>
      <ResetForm />
    </div>
  )
}
