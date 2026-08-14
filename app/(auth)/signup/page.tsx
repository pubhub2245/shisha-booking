import { BrandWordmark } from '@/components/brand-wordmark'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthForm } from '../auth-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: '新規登録 — 煙道' }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(next && next.startsWith('/') ? next : '/')

  return (
    <div className="wrap max-w-md py-16">
      <BrandWordmark />
      <h1 className="mt-6 text-3xl" style={{ fontWeight: 800 }}>
        図鑑に参加する
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        無料で登録。あなたのミックスを投稿して、シーシャの「美味しい」を広げよう。
      </p>
      <AuthForm mode="signup" next={next} />
    </div>
  )
}
