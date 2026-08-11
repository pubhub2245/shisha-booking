import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { resolveMode } from '@/lib/mode'
import { ModeToggle } from '@/components/mode-toggle'
import { signOut } from '@/actions/auth'
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
import { Avatar } from '@/components/avatar'
import { VerifiedBadge } from '@/components/verified-badge'
import type { MixWithRelations } from '@/lib/types/database'
import { ProfileForm } from './profile-form'
import { ProApplicationForm } from './pro-application'
import { InviteButton } from '@/components/invite-button'

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
              <a href="#profile-edit" className="btn btn-ember text-sm">プロフィールを編集</a>
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
                自己紹介はまだありません。<a href="#profile-edit" style={{ color: 'var(--color-ember-hot)' }}>プロフィールを編集</a>して追加しましょう。
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
        <Link href="/shelf" className="btn btn-ghost text-sm">🫙 マイ棚</Link>
        <InviteButton />
        <form action={signOut} className="md:hidden">
          <button type="submit" className="btn btn-ghost text-sm">ログアウト</button>
        </form>
      </div>

      {/* 管理者リンク */}
      {user.profile?.is_admin && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href="/admin/pro" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>🛡 プロ認証の審査</Link>
          <Link href="/admin/clicks" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>📊 送客クリック集計</Link>
          <Link href="/admin/reports" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>🛡 通報の管理</Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>表示モード</h2>
        {(() => {
          const mode = resolveMode(user.profile)
          return (
            <div className="card mt-2 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm" style={{ fontWeight: 700 }}>
                  {mode === 'pro' ? '🛠 プロモード' : '🔰 かんたんモード'}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                  {mode === 'pro'
                    ? '熱管理・器具・蒸らし・練習ログまで、すべての機能が使えます。'
                    : 'フレーバーと味わい中心のシンプルな表示。細かい設定は隠れています。'}
                </p>
              </div>
              {mode === 'pro' ? (
                <ModeToggle target="simple" label="🔰 かんたんモードにする" className="btn btn-ghost shrink-0 text-sm" />
              ) : (
                <ModeToggle target="pro" label="🛠 プロモードにする" className="btn btn-ember shrink-0 text-sm" />
              )}
            </div>
          )
        })()}
      </section>

      <section id="profile-edit" className="mt-8 scroll-mt-20">
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
