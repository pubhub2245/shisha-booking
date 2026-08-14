import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getMixesByAuthor,
  getLikedMixIds,
  getBookmarkedMixes,
  getLikedMixes,
  getFollowCounts,
  getMyShops,
  getSmokeLog,
} from '@/lib/queries'
import { MixCard } from '@/components/mix-card'
import { Avatar } from '@/components/avatar'
import { VerifiedBadge } from '@/components/verified-badge'
import type { MixWithRelations } from '@/lib/types/database'
import { InviteButton } from '@/components/invite-button'
import { EndoLog } from '@/components/endo-log'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'マイ煙道 — 煙道' }

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

  const [myMixes, likedIds, bookmarked, liked, counts, myShops, smokeLog] = await Promise.all([
    getMixesByAuthor(user.id),
    getLikedMixIds(),
    getBookmarkedMixes(),
    getLikedMixes(),
    getFollowCounts(user.id),
    getMyShops(),
    getSmokeLog(30),
  ])

  const displayName = user.profile?.display_name || (user.profile?.username ? `@${user.profile.username}` : 'あなた')
  const username = user.profile?.username
  const bio = user.profile?.bio
  const avatarUrl = user.profile?.avatar_url

  return (
    <div className="wrap max-w-3xl py-10">
      {/* ---------- プロフィールヘッダー（SNS風） ---------- */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
        {/* カバー画像 */}
        <div
          className="h-28 w-full sm:h-36"
          style={{ background: 'linear-gradient(120deg, var(--color-coal), var(--color-ember) 58%, #d4a017)' }}
        />
        <div className="px-4 pb-4">
          <div className="-mt-12 flex items-end justify-between gap-3">
            {/* アバター */}
            <div className="rounded-full p-1" style={{ background: 'var(--surface)' }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24" />
              ) : (
                <Avatar name={displayName} seed={user.id} size={88} />
              )}
            </div>
            {/* アクション */}
            <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
              {username && (
                <Link href={`/u/${username}`} className="btn btn-ghost text-sm">公開プロフィール</Link>
              )}
              <Link href="/mypage/edit" className="btn btn-ember text-sm">プロフィールを編集</Link>
            </div>
          </div>

          {/* 名前・@・自己紹介 */}
          <div className="mt-2">
            <h1 className="flex items-center gap-1.5 text-2xl" style={{ fontWeight: 800 }}>
              <span>{displayName}</span>
              {user.profile?.is_pro && <VerifiedBadge size={18} />}
            </h1>
            {username && <div className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>@{username}</div>}
            {bio ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{bio}</p>
            ) : (
              <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
                自己紹介はまだありません。<Link href="/mypage/edit" style={{ color: 'var(--color-ember-hot)' }}>プロフィールを編集</Link>して追加しましょう。
              </p>
            )}
          </div>

          {/* 実績 */}
          <div className="mt-4 flex gap-5 text-sm">
            <span><b>{myMixes.length}</b> <span style={{ color: 'var(--color-ash-dim)' }}>投稿</span></span>
            <span><b>{counts.followers}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロワー</span></span>
            <span><b>{counts.following}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロー中</span></span>
          </div>
        </div>
      </div>

      {/* サブアクション */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href="/shelf" className="btn btn-ghost text-sm">🫙 マイフレーバー</Link>
        <InviteButton />
        <Link href="/mypage/edit" className="btn btn-ghost text-sm">⚙️ 設定</Link>
      </div>

      {/* ---------- 煙道帳：自分のシーシャの記録（探す→吸う→残す の「残す」） ---------- */}
      <section className="mt-8">
        <div className="card card-wa p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>
              <span className="seal seal-stamp mr-2 text-xs">帳</span>煙道帳
            </h2>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>今月の煙道</span>
          </div>

          {/* 今月のサマリー（0件でも違和感なく出す） */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: '吸った', value: smokeLog.month.smoked, unit: '回' },
              { label: '作った', value: smokeLog.month.made, unit: '回' },
              { label: 'また吸いたい', value: smokeLog.month.again, unit: '' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg px-3 py-2.5 text-center" style={{ background: 'var(--accent-tint)' }}>
                <div className="text-xl" style={{ fontWeight: 800, color: 'var(--color-cream)' }}>
                  {s.value}
                  {s.unit && <span className="ml-0.5 text-xs" style={{ fontWeight: 600, color: 'var(--color-ash-dim)' }}>{s.unit}</span>}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ash)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="kaisen mt-4" aria-hidden><span className="seal-dot" /></div>

          {smokeLog.entries.length > 0 ? (
            <>
              <h3 className="mt-3 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>最近の煙道</h3>
              <EndoLog entries={smokeLog.entries} />
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              まだ記録がありません。気になる一台を見つけて「吸った」を押すと、ここに自分の記録が積み上がっていきます。
              <br />
              <Link href="/" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>今日の一台を探す →</Link>
            </p>
          )}
        </div>
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
