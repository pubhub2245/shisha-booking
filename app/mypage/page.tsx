import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getMixesByAuthor,
  getLikedMixIds,
  getBookmarkedMixes,
  getLikedMixes,
  getFollowCounts,
  getMyProApplication,
  getMyShops,
} from '@/lib/queries'
import { MixCard } from '@/components/mix-card'
import type { MixWithRelations } from '@/lib/types/database'
import { ProfileForm } from './profile-form'
import { ProApplicationForm } from './pro-application'

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

  const [myMixes, likedIds, bookmarked, liked, counts, proApp, myShops] = await Promise.all([
    getMixesByAuthor(user.id),
    getLikedMixIds(),
    getBookmarkedMixes(),
    getLikedMixes(),
    getFollowCounts(user.id),
    getMyProApplication(),
    getMyShops(),
  ])

  return (
    <div className="wrap max-w-3xl py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">My page</p>
          <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>マイページ</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/shelf" className="btn btn-ghost text-sm">
            🫙 マイ棚
          </Link>
          {user.profile?.username && (
            <Link href={`/u/${user.profile.username}`} className="btn btn-ghost text-sm">
              公開プロフィール →
            </Link>
          )}
          {user.profile?.is_admin && (
            <div className="flex flex-col items-end gap-1">
              <Link href="/admin/pro" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                🛡 プロ認証の審査へ
              </Link>
              <Link href="/admin/clicks" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                📊 送客クリック集計
              </Link>
              <Link href="/admin/reports" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                🛡 通報の管理
              </Link>
            </div>
          )}
        </div>
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>所属店舗</h2>
          <Link href="/shop/new" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>＋ お店を登録</Link>
        </div>
        {myShops.length > 0 ? (
          <div className="flex flex-col gap-2">
            {myShops.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
                <Link href={`/shop/${s.id}`} className="flex min-w-0 items-center gap-2">
                  {s.role === 'owner' && <span aria-hidden title="オーナー">👑</span>}
                  <span className="truncate text-sm" style={{ fontWeight: 700 }}>🏠 {s.name}</span>
                  {s.area && <span className="shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>{s.area}</span>}
                </Link>
                <Link href={`/shop/${s.id}/manage`} className="btn btn-ghost shrink-0 text-xs">在庫・管理</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-5 text-sm" style={{ color: 'var(--color-ash)' }}>
            シーシャ店で働いている方は、<Link href="/shop/new" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>お店を登録</Link>
            するか、
            <Link href="/shops" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>店舗一覧</Link>
            から働いているお店に参加申請できます。
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロ認証（シーシャ店スタッフ）</h2>
        <ProApplicationForm
          isPro={user.profile?.is_pro ?? false}
          application={proApp}
          shops={myShops.map((s) => ({ id: s.id, name: s.name }))}
        />
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
