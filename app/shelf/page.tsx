import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getFlavorsWithUsage, getMyShelfFlavorIds, getFlavorsWithMethods } from '@/lib/queries'
import { ShelfFlavorChip } from '@/components/shelf-flavor-chip'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'マイフレーバー',
  description: '持っているフレーバーを登録すると、いま手元で試せる作り方が表示されます。',
}

type FlavorWithCount = Flavor & { count: number }

export default async function ShelfPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/shelf')

  const [flavors, shelfIds, allWithMethods] = await Promise.all([
    getFlavorsWithUsage(),
    getMyShelfFlavorIds(),
    getFlavorsWithMethods(),
  ])
  // 煙道は1つのフレーバーを扱うので、「作れるか」は在庫の有無そのもの。
  // 意味があるのは「手元にあるフレーバーのうち、試せる作り方があるのはどれか」。
  const readyToTry = allWithMethods.filter((f) => shelfIds.has(f.flavor.id) && f.methodCount > 0)

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
        持っているフレーバーを選ぶと、<b>いま手元で試せる作り方</b>が下に表示されます。
      </p>

      {/* ---------- 手元で試せる作り方 ---------- */}
      <section className="mt-8">
        <h2 className="text-lg" style={{ fontWeight: 700 }}>
          🔥 いま手元で試せる（{readyToTry.length}）
        </h2>
        {ownedCount === 0 ? (
          <div className="card mt-3 p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まず下の一覧から、持っているフレーバーを選んでみましょう。
            </p>
          </div>
        ) : readyToTry.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {readyToTry.map(({ flavor, methodCount }) => (
              <Link
                key={flavor.id}
                href={`/flavor/${flavor.id}`}
                className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</span>
                <span className="truncate text-sm" style={{ fontWeight: 700 }}>{flavor.name}</span>
                <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                  {methodCount} 通りの作り方
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              手元のフレーバーには、まだ作り方が登録されていません。
              <br />
              <Link href="/post" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>あなたのやり方</Link>
              が最初の一台になります。
            </p>
          </div>
        )}
      </section>

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
