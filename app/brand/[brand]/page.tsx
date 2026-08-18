import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFlavorsByBrand, getMixesUsingBrand, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params
  const name = decodeURIComponent(brand)
  return {
    title: `${name} のフレーバー一覧 — 煙道`,
    description: `${name} のシーシャフレーバーと、その作り方のまとめ。`,
  }
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params
  const name = decodeURIComponent(brand)

  const [flavors, mixes, likedIds, user] = await Promise.all([
    getFlavorsByBrand(name),
    getMixesUsingBrand(name),
    getLikedMixIds(),
    getCurrentUser(),
  ])
  if (flavors.length === 0) notFound()

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← フレーバー図鑑</Link>
      <p className="eyebrow mt-4">Brand</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{name}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        {name} のフレーバー {flavors.length} 種。タップで各フレーバーの作り方・購入へ。
      </p>

      <section className="mt-6">
        <div className="flex flex-wrap gap-2">
          {flavors.map((f) => (
            <Link key={f.id} href={`/flavor/${f.id}`} className={`chip ${f.count > 0 ? 'chip-active' : ''}`}>
              {f.name}
              {f.count > 0 && <span style={{ opacity: 0.7 }}> {f.count}</span>}
            </Link>
          ))}
        </div>
      </section>

      {mixes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg" style={{ fontWeight: 700 }}>{name} を使った作り方（{mixes.length}）</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {mixes.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
