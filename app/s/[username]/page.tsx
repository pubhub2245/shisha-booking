import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProfileByUsername, getShopFlavors, getShopMenuCombos } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { ComboCard } from '@/components/combo-card'
import { VerifiedBadge } from '@/components/verified-badge'
import { Avatar } from '@/components/avatar'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: 'お店が見つかりません — MixHub' }
  const name = profile.shop_name || profile.display_name || `@${username}`
  return {
    title: `${name} のメニュー — MixHub`,
    description: `${name} で今吸えるフレーバーと、作れるミックスの一覧。`,
  }
}

export default async function ShopMenuPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile || !profile.is_shop) notFound()

  const [flavors, combos, me] = await Promise.all([
    getShopFlavors(profile.id),
    getShopMenuCombos(profile.id),
    getCurrentUser(),
  ])
  const isOwner = me?.id === profile.id
  const shopName = profile.shop_name || profile.display_name || `@${profile.username}`

  // ブランド別
  const byBrand = new Map<string, Flavor[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      {/* ---------- SHOP HEADER ---------- */}
      <div className="card p-6 fade-up">
        <div className="flex items-start gap-3">
          <Avatar name={shopName} seed={profile.id} size={52} />
          <div className="min-w-0 flex-1">
            <span className="chip chip-active mb-2 inline-flex">🏠 店頭メニュー</span>
            <h1 className="flex items-center gap-1.5 text-2xl" style={{ fontWeight: 800 }}>
              <span className="truncate">{shopName}</span>
              {profile.is_pro && <VerifiedBadge size={19} />}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
              {profile.shop_area && <span>📍 {profile.shop_area}</span>}
              <Link href={`/u/${profile.username}`} style={{ color: 'var(--color-ember-hot)' }}>プロフィール →</Link>
            </div>
          </div>
          {isOwner && (
            <Link href="/shop/inventory" className="btn btn-ghost shrink-0 text-sm">在庫を編集</Link>
          )}
        </div>
        <p className="mt-4 border-t pt-4 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--color-ash)' }}>
          この中から好きなフレーバーを選んでください。タップすると、そのフレーバーの詳細や作れるミックスが見られます。
        </p>
      </div>

      {flavors.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>メニューは準備中です</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            このお店はまだ在庫フレーバーを登録していません。
          </p>
          {isOwner && <Link href="/shop/inventory" className="btn btn-ember mt-5">在庫を登録する</Link>}
        </div>
      ) : (
        <>
          {/* ---------- MENU（在庫フレーバー） ---------- */}
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg" style={{ fontWeight: 700 }}>🍃 今あるフレーバー（{flavors.length}）</h2>
            </div>
            <div className="flex flex-col gap-5">
              {brands.map((brand) => (
                <div key={brand}>
                  <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>{brand}</h3>
                  <div className="flex flex-wrap gap-2">
                    {byBrand.get(brand)!.map((f) => (
                      <Link key={f.id} href={`/flavor/${f.id}`} className="chip">{f.name}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- このお店で作れるミックス ---------- */}
          {combos.length > 0 && (
            <section className="mt-12">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg" style={{ fontWeight: 700 }}>🔥 このお店で作れるミックス（{combos.length}）</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {combos.slice(0, 12).map((combo) => (
                  <ComboCard key={combo.key} combo={combo} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
