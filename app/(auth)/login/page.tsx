import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthForm } from '../auth-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ログイン — 煙道' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(next && next.startsWith('/') ? next : '/')

  return (
    <div className="wrap max-w-md py-16">
      <Link href="/" className="brand-mark text-2xl">
        Mix<span className="ember-text">Hub</span>
      </Link>
      <h1 className="mt-6 text-3xl" style={{ fontWeight: 800 }}>
        おかえりなさい
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        ログインして、いいね・投稿を始めましょう。
      </p>
      {error === 'link' && (
        <div className="mt-6 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}>
          リンクの有効期限が切れているか、既に使用済みです。もう一度お試しください。
        </div>
      )}
      <AuthForm mode="login" next={next} />
    </div>
  )
}
