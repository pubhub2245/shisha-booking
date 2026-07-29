import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getMixesByAuthor, getLikedMixIds } from '@/lib/queries'
import { MixCard } from '@/components/mix-card'
import { ProfileForm } from './profile-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'マイページ — MixHub' }

export default async function MyPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mypage')

  const [myMixes, likedIds] = await Promise.all([getMixesByAuthor(user.id), getLikedMixIds()])

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">My page</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        マイページ
      </h1>

      <section className="mt-6">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロフィール</h2>
        <ProfileForm profile={user.profile} />
      </section>

      <div className="divider my-10" />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>
            投稿したミックス（{myMixes.length}）
          </h2>
          <Link href="/post" className="btn btn-ghost text-sm">＋ 新しく投稿</Link>
        </div>

        {myMixes.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {myMixes.map((mix) => (
              <MixCard key={mix.id} mix={mix} liked={likedIds.has(mix.id)} isAuthed />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まだ投稿がありません。最初のミックスを投稿しましょう。
            </p>
            <Link href="/post" className="btn btn-ember mt-4">＋ ミックスを投稿</Link>
          </div>
        )}
      </section>
    </div>
  )
}
