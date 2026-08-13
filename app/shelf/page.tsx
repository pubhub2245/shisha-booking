import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getFlavorsWithUsage, getMyShelfFlavorIds, getCombos, getMyNearMakeable } from '@/lib/queries'
import { ComboCard } from '@/components/combo-card'
import { ShelfFlavorChip } from '@/components/shelf-flavor-chip'
import { ShelfButton } from '@/components/shelf-button'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'マイフレーバー — 煙道',
  description: '持っているフレーバーを登録すると、いま手元で作れるミックスだけが表示されます。',
}

type FlavorWithCount = Flavor & { count: number }

export default async function ShelfPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/shelf')

  const [flavors, shelfIds, makeable, near] = await Promise.all([
    getFlavorsWithUsage(),
    getMyShelfFlavorIds(),
    getCombos({ makeableOnly: true, sort: 'detailed' }),
    getMyNearMakeable(),
  ])

  const ownedCount = shelfIds.size

  // ブランド別にグループ化（所持を上に）
  const byBrand = new Map<string, FlavorWithCount[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">My Shelf</p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl" style={{ fontWeight: 800 }}>
        <span aria-hidden>🫙</span> マイフレーバー
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        持っているフレーバーを選ぶと、<b>いま手元だけで作れるミックス</b>が下に表示されます。
      </p>

      {/* ---------- 作れるミックス ---------- */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>
            🔥 いま作れるミックス（{makeable.length}）
          </h2>
        </div>
        {ownedCount === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まず下の一覧から、持っているフレーバーを選んでみましょう。
            </p>
          </div>
        ) : makeable.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {makeable.map((combo) => (
              <ComboCard key={combo.key} combo={combo} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              いまの棚だけで作れるミックスはまだありません。フレーバーを増やすか、
              <Link href="/post" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>あなたが投稿</Link>
              してみましょう。
            </p>
          </div>
        )}
      </section>

      {/* ---------- あと1つで作れる ---------- */}
      {near.length > 0 && (
        <section className="mt-12">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>🛒 あと1つで作れる（{near.length}）</h2>
          </div>
          <p className="mb-3 text-sm" style={{ color: 'var(--color-ash)' }}>
            不足しているフレーバーを1つ足すだけで作れる組み合わせです。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {near.map(({ combo, missing }) => (
              <div key={combo.key} className="card flex flex-col gap-3 p-4">
                <Link href={`/combo/${combo.slug}`} className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ fontWeight: 700 }}>
                  {combo.flavorNames.slice(0, 4).map((n, i) => {
                    const isMissing = n === missing.name
                    return (
                      <span key={i} className="flex items-center gap-2">
                        {i > 0 && <span style={{ color: 'var(--color-ember)' }}>×</span>}
                        <span style={isMissing ? { color: 'var(--color-ash-dim)', textDecoration: 'underline dotted' } : undefined}>{n}</span>
                      </span>
                    )
                  })}
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-ash)' }}>
                    不足: <b style={{ color: 'var(--color-ember-hot)' }}>{missing.name}</b>
                    {missing.brand ? <span style={{ color: 'var(--color-ash-dim)' }}>（{missing.brand}）</span> : null}
                  </span>
                  {missing.flavorId ? (
                    <div className="flex items-center gap-2">
                      <ShelfButton flavorId={missing.flavorId} initialOwned={false} isAuthed nextPath="/shelf" />
                      <Link href={`/flavor/${missing.flavorId}`} className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳細 →</Link>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- 棚の編集 ---------- */}
      <section className="mt-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>
            持っているフレーバー
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{ownedCount} 種を登録中</span>
        </div>
        {flavors.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
            まだフレーバーが登録されていません。
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {brands.map((brand) => (
              <div key={brand}>
                <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>{brand}</h3>
                <div className="flex flex-wrap gap-2">
                  {byBrand.get(brand)!.map((f) => (
                    <ShelfFlavorChip
                      key={f.id}
                      flavorId={f.id}
                      label={f.name}
                      initialOwned={shelfIds.has(f.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
