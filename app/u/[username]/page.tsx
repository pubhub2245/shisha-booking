import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProfileByUsername,
  getMixesByAuthor,
  getLikedMixIds,
  getFollowCounts,
  isFollowing,
  getShopsByMember,
  getAuthorStats,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { flavorLine } from '@/lib/mix'
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

  const [mixes, likedIds, counts, following, me, shops, stats] = await Promise.all([
    getMixesByAuthor(profile.id),
    getLikedMixIds(),
    getFollowCounts(profile.id),
    isFollowing(profile.id),
    getCurrentUser(),
    getShopsByMember(profile.id),
    getAuthorStats(profile.id),
  ])
  const isSelf = me?.id === profile.id
  const displayName = profile.display_name || `@${profile.username}`

  return (
    <div className="wrap max-w-3xl py-10">
      {/* ---------- PROFILE HEADER ---------- */}
      <div className="card p-6 fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={profile.display_name || profile.username} seed={profile.id} size={52} src={profile.avatar_url} />
            <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {profile.is_founder && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                  style={{ background: 'linear-gradient(90deg, #a16207, #d4a017)', color: '#fff', fontWeight: 800 }}
                >
                  🎖️ 創設メンバー
                </span>
              )}
              {profile.is_shop && <span className="chip chip-active inline-flex">🏠 店舗スタッフ</span>}
            </div>
            <h1 className="flex items-center gap-1.5 text-2xl" style={{ fontWeight: 800 }}>
              <span className="truncate">{displayName}</span>
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

        {/* 日本代表の冠（保有していれば実力の証） */}
        {stats.repCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}>🇯🇵 日本代表</span>
            {stats.repCategories.map((c) => (
              <Link
                key={c}
                href="/national"
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{ background: 'linear-gradient(90deg, #9a3226, #b23b2e)', color: '#fff', fontWeight: 800 }}
              >
                {c}系
              </Link>
            ))}
          </div>
        )}

        {/* 実績スタッツ（作品集の"顔"） */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { n: stats.mixCount, l: 'ミックス' },
            { n: stats.totalLikes, l: '累計いいね' },
            { n: stats.totalMakes, l: '作られた' },
            { n: stats.repCategories.length, l: '代表 冠' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border px-2 py-2.5 text-center" style={{ borderColor: 'var(--line)' }}>
              <div className="text-lg" style={{ fontWeight: 800 }}>{s.n}</div>
              <div className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-5 text-sm">
          <span><b>{counts.followers}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロワー</span></span>
          <span><b>{counts.following}</b> <span style={{ color: 'var(--color-ash-dim)' }}>フォロー中</span></span>
        </div>

        {shops.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>所属店舗</span>
            <div className="flex flex-wrap gap-2">
              {shops.map((s) => (
                <Link key={s.id} href={`/shop/${s.id}`} className="chip chip-active inline-flex items-center gap-1">
                  {s.role === 'owner' && <span aria-hidden>👑</span>}
                  🏠 {s.name}
                  {s.area ? <span style={{ opacity: 0.7 }}> ・{s.area}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- 看板レシピ ---------- */}
      {(() => {
        const pinned = profile.pinned_mix_id ? mixes.find((m) => m.id === profile.pinned_mix_id) : null
        if (!pinned) return null
        return (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-lg" style={{ fontWeight: 700 }}>
              📌 看板レシピ
            </h2>
            <div className="rounded-2xl p-0.5" style={{ background: 'linear-gradient(135deg, var(--color-ember), #d4a017)' }}>
              <div className="rounded-[calc(1rem-1px)]" style={{ background: 'var(--surface)' }}>
                <MixCard mix={pinned} liked={likedIds.has(pinned.id)} isAuthed={!!me} />
              </div>
            </div>
          </section>
        )
      })()}

      {/* ---------- PHOTO GRID ---------- */}
      {mixes.some((m) => m.pack_photo_url) && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>📷 写真</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {mixes
              .filter((m) => m.pack_photo_url)
              .map((m) => (
                <Link key={m.id} href={`/mix/${m.id}`} className="group block overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.pack_photo_url!}
                    alt={`${flavorLine(m.mix_flavors)} の盛り方`}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </Link>
              ))}
          </div>
        </section>
      )}

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
