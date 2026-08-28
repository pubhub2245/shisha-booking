import Link from 'next/link'
import { LineIcon } from '@/components/line-icons'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMixesByHmsType, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { flavorLine } from '@/lib/mix'
import { HmsIcon } from '@/components/hms-icon'
import { BowlIcon } from '@/components/bowl-icon'
import { HMS_LISTED, hmsOption, hmsBowls, hmsSlug } from '@/lib/heat'
import { SourceLine } from '@/components/source-line'
import { HMS_SOURCES } from '@/lib/sources'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const hms = hmsOption(type)
  if (!hms) return { title: 'HMS' }
  return {
    title: `${hms.l}の実例・使い方`,
    description: `${hms.l}（${hms.en}）を使ったシーシャの作り方・盛り方の実例まとめ。${hms.desc}`,
  }
}

export default async function HmsTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const hms = hmsOption(type)
  if (!hms || hms.v === 'other') notFound()

  const [mixes, likedIds, user] = await Promise.all([
    getMixesByHmsType(hms.v),
    getLikedMixIds(),
    getCurrentUser(),
  ])

  const photoMixes = mixes.filter((m) => m.pack_photo_url)
  const bowls = hmsBowls(hms.v)

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/guide#hms-bowl" className="inline-flex min-h-11 items-center text-sm" style={{ color: 'var(--color-ash-dim)' }}>← 作り方ガイド（HMD×ボウル）</Link>

      <div className="mt-4 flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
        >
          <HmsIcon type={hms.icon} size={48} />
        </span>
        <div>
          <p className="eyebrow">HMS / HMD</p>
          <h1 className="mt-1 text-2xl" style={{ fontWeight: 800 }}>
            {hms.l}
            {hms.en && <span className="ml-2 text-sm" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>{hms.en}</span>}
          </h1>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{hms.desc}</p>

      {bowls.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>相性の良いボウル：</span>
          {bowls.map((b) => (
            <Link
              key={b.v}
              href={`/bowl/${b.v}`}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--accent-tint)]"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
            >
              <span style={{ color: 'var(--color-ember-hot)' }}><BowlIcon type={b.icon} size={16} /></span>
              {b.l}
            </Link>
          ))}
        </div>
      )}
      {hms.bowlNote && (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>{hms.bowlNote}</p>
      )}
      <SourceLine sources={HMS_SOURCES} className="mt-2" />

      {/* 実例写真ギャラリー */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>みんなの{hms.l}の作り方</h2>
        {photoMixes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoMixes.map((m) => (
              <Link key={m.id} href={`/method/${m.id}`} className="group block overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.pack_photo_url!}
                  alt={`${flavorLine(m.mix_flavors)} の盛り方`}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="truncate px-2 py-1.5 text-xs" style={{ color: "var(--color-ash)" }}>{flavorLine(m.mix_flavors)}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <span style={{ color: 'var(--color-ash-dim)' }}><LineIcon name="camera" size={30} /></span>
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まだ{hms.l}の写真がありません。<br />あなたの投稿が最初の実例になるかも。
            </p>
            <Link href="/post" className="btn btn-ember text-sm">作り方を投稿する</Link>
          </div>
        )}
      </section>

      {mixes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg" style={{ fontWeight: 700 }}>{hms.l}を使った作り方（{mixes.length}）</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {mixes.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-3 text-sm eyebrow">他のHMS</h2>
        <div className="flex flex-wrap gap-2">
          {HMS_LISTED.filter((o) => o.v !== hms.v).map((o) => (
            <Link key={o.v} href={`/hms/${hmsSlug(o)}`} className="chip inline-flex items-center gap-1">
              <span style={{ color: 'var(--color-ember-hot)' }}><HmsIcon type={o.icon} size={16} /></span>
              {o.l}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
