import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MixForm } from '@/components/mix-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ミックスを投稿 — MixHub' }

export default async function PostPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/post')

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Post a mix</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        ミックスを投稿
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        あなたの一杯を図鑑に。いいねが集まれば人気ミックスとしてみんなの参考になります。
      </p>
      <MixForm mode="create" />
    </div>
  )
}
