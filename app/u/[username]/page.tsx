import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProfileByUsername,
  getMixesByAuthor,
  getLikedMixIds,
  getFollowCounts,
  isFollowing,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { FollowButton } from '@/components/follow-button'
import { VerifiedBadge } from '@/components/verified-badge'
import { Avatar } from '@/components/avatar'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: 'ユーザーが見つかりません — MixHub' }
  const name = profile.is_shop && profile.shop_name ? profile.shop_name : profile.display_name || `@${username}`
  return { title: `${name} のミックス — MixHub`, description: profile.bio ?? undefined }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const [mixes, likedIds, counts, following, me] = await Promise.all([
    getMixesByAuthor(profile.id),
    getLikedMixIds(),
    getFollowCounts(profile.id),
    isFollowing(profile.id),
    getCurrentUser(),
  ])
  const isSelf = me?.id === profile.id
  const displayName = profile.display_name || `@${profile.username}`

  return (
    <div className="wrap max-w-3xl py-10">
      {/* ---------- PROFILE HEADER ---------- */}
      <div className="card p-6 fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={profile.shop_name || profile.display_name || profile.username} seed={profile.id} size={52} />
            <div className="min-w-0">
            {profile.is_shop && (
              <span className="chip chip-active mb-2 inline-flex">🏠 店舗</span>
            )}
            <h1 className="flex items-center gap-1.5 text-2xl" style={{ fontWeight: 800 }}>
              <span className="truncate">
                {profile.is_shop && profile.shop_name ? profile.shop_name : displayName}
              </span>
              {profile.is_pro && <VerifiedBadge size={19} />}
            </h1>
            <div className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>@{profile.username}</div>
            {profile.is_pro && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                <VerifiedBadge size={12} /> シーシャ店スタッフ（認証済み）
              </div>
            )}
            </div>
          </div>
          <div className="shrink-0">
            {isSelf ? (
              <Link href="/mypage" className="btn btn-ghost text-sm">プロフィール編集</Link>
            ) : (
              <FollowButton
                targetId={profile.id}
                initialFollowing={following}
                isAuthed={!!me}
                username={profile.username ?? ''}
              />
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            {profile.bio}
          </p>
        )}

        <div className="mt-4 flex gap-5 text-sm">
          <span><b>{mixes.length}</b> <span style={{ color: 'var(--color-ash-dim)' }}>ミックス</span></span>
          <span><b>{counts.followers}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロワー</span></span>
          <span><b>{counts.following}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロー中</span></span>
        </div>

        {profile.is_shop && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-sm" style={{ borderColor: 'var(--line)' }}>
            {profile.shop_area && <span style={{ color: 'var(--color-ash)' }}>📍 {profile.shop_area}</span>}
            <Link href={`/s/${profile.username}`} className="btn btn-ember text-sm">🍃 店頭メニューを見る</Link>
            {profile.shop_url && (
              <a href={profile.shop_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-sm">
                お店のリンク →
              </a>
            )}
          </div>
        )}
      </div>

      {/* ---------- MIXES ---------- */}
      <h2 className="mb-4 mt-8 text-lg" style={{ fontWeight: 700 }}>
        投稿したミックス
      </h2>
      {mixes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {mixes.map((m) => (
            <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!me} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          まだミックスの投稿がありません。
        </div>
      )}
    </div>
  )
}
