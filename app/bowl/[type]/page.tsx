import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMixesByBowlType, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { BowlIcon } from '@/components/bowl-icon'
import { BOWL_OPTIONS, bowlOption, HMS_OPTIONS } from '@/lib/heat'
import { SourceLine } from '@/components/source-line'
import { BOWL_SOURCES } from '@/lib/sources'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const bowl = bowlOption(type)
  if (!bowl) return { title: 'ボウル — MixHub' }
  return {
    title: `${bowl.l}ボウルの実例・使い方 — MixHub`,
    description: `${bowl.l}（${bowl.en}）を使ったシーシャの盛り方・作り方の実例まとめ。${bowl.desc}`,
  }
}

export default async function BowlTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const bowl = bowlOption(type)
  if (!bowl || bowl.v === 'other') notFound()

  const [mixes, likedIds, user] = await Promise.all([
    getMixesByBowlType(bowl.v),
    getLikedMixIds(),
    getCurrentUser(),
  ])

  // 実際の投稿写真（盛り方の写真がある投稿）
  const photoMixes = mixes.filter((m) => m.pack_photo_url)
  // このボウルと相性が良いとされるHMS
  const compatibleHms = HMS_OPTIONS.filter((o) => o.bowls?.includes(bowl.v))

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/guide#hms-bowl" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← 作り方ガイド（HMD×ボウル）</Link>

      <div className="mt-4 flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
        >
          <BowlIcon type={bowl.icon} size={48} />
        </span>
        <div>
          <p className="eyebrow">Bowl</p>
          <h1 className="mt-1 text-2xl" style={{ fontWeight: 800 }}>
            {bowl.l}
            {bowl.en && <span className="ml-2 text-sm" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>{bowl.en}</span>}
          </h1>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{bowl.desc}</p>

      {compatibleHms.length > 0 && (
        <div className="mt-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          相性の良いHMD：{compatibleHms.map((o) => o.l).join('・')}
        </div>
      )}
      <SourceLine sources={BOWL_SOURCES} className="mt-2" />

      {/* 実例写真ギャラリー */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>
          📷 みんなの{bowl.l}の盛り方
        </h2>
        {photoMixes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoMixes.map((m) => (
              <Link key={m.id} href={`/mix/${m.id}`} className="group block overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.pack_photo_url!}
                  alt={`${m.title} の盛り方`}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="truncate px-2 py-1.5 text-xs" style={{ color: 'var(--color-ash)' }}>{m.title}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="text-3xl" aria-hidden>📷</span>
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まだ{bowl.l}の盛り方写真がありません。<br />あなたの投稿が最初の実例になるかも。
            </p>
            <Link href="/post" className="btn btn-ember text-sm">盛り方を投稿する</Link>
          </div>
        )}
      </section>

      {/* このボウルを使ったミックス */}
      {mixes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg" style={{ fontWeight: 700 }}>{bowl.l}を使ったミックス（{mixes.length}）</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {mixes.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      {/* 他のボウルへ */}
      <section className="mt-12">
        <h2 className="mb-3 text-sm eyebrow">他のボウル</h2>
        <div className="flex flex-wrap gap-2">
          {BOWL_OPTIONS.filter((o) => o.v !== 'other' && o.v !== bowl.v).map((o) => (
            <Link key={o.v} href={`/bowl/${o.v}`} className="chip inline-flex items-center gap-1">
              <span style={{ color: 'var(--color-ember-hot)' }}><BowlIcon type={o.icon} size={16} /></span>
              {o.l}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
