import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getMixesByAuthor,
  getLikedMixIds,
  getBookmarkedMixes,
  getLikedMixes,
  getFollowCounts,
} from '@/lib/queries'
import { MixCard } from '@/components/mix-card'
import type { MixWithRelations } from '@/lib/types/database'
import { ProfileForm } from './profile-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'マイページ — MixHub' }

function MixGrid({
  mixes,
  likedIds,
  emptyText,
}: {
  mixes: MixWithRelations[]
  likedIds: Set<string>
  emptyText: string
}) {
  if (mixes.length === 0) {
    return (
      <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        {emptyText}
      </div>
    )
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {mixes.map((mix) => (
        <MixCard key={mix.id} mix={mix} liked={likedIds.has(mix.id)} isAuthed />
      ))}
    </div>
  )
}

export default async function MyPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mypage')

  const [myMixes, likedIds, bookmarked, liked, counts] = await Promise.all([
    getMixesByAuthor(user.id),
    getLikedMixIds(),
    getBookmarkedMixes(),
    getLikedMixes(),
    getFollowCounts(user.id),
  ])

  return (
    <div className="wrap max-w-3xl py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>マイページ</h1>
        </div>
        {user.profile?.username && (
          <Link href={`/u/${user.profile.username}`} className="btn btn-ghost text-sm">
            公開プロフィール →
          </Link>
        )}
      </div>

      <div className="mt-4 flex gap-5 text-sm">
        <span><b>{myMixes.length}</b> <span style={{ color: 'var(--color-ash-dim)' }}>投稿</span></span>
        <span><b>{counts.followers}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロワー</span></span>
        <span><b>{counts.following}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロー中</span></span>
      </div>

      <section className="mt-8">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロフィール</h2>
        <ProfileForm profile={user.profile} />
      </section>

      <div className="divider my-10" />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>投稿したミックス（{myMixes.length}）</h2>
          <Link href="/post" className="btn btn-ghost text-sm">＋ 新しく投稿</Link>
        </div>
        <MixGrid mixes={myMixes} likedIds={likedIds} emptyText="まだ投稿がありません。最初のミックスを投稿しましょう。" />
      </section>

      <div className="divider my-10" />

      <section>
        <h2 className="mb-4 text-lg" style={{ fontWeight: 700 }}>🔖 保存したミックス（{bookmarked.length}）</h2>
        <MixGrid mixes={bookmarked} likedIds={likedIds} emptyText="保存したミックスはまだありません。" />
      </section>

      <div className="divider my-10" />

      <section>
        <h2 className="mb-4 text-lg" style={{ fontWeight: 700 }}>❤️ いいねしたミックス（{liked.length}）</h2>
        <MixGrid mixes={liked} likedIds={likedIds} emptyText="いいねしたミックスはまだありません。" />
      </section>
    </div>
  )
}
