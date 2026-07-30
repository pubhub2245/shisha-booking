import Link from 'next/link'
import { getFlavors } from '@/lib/queries'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'フレーバー図鑑 — MixHub',
  description: 'シーシャのフレーバーを一覧。ブランド別に探して、使われているミックスや購入リンクをチェック。',
}

export default async function FlavorsPage() {
  const flavors = await getFlavors()

  // ブランド別にグループ化
  const byBrand = new Map<string, Flavor[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Flavor directory</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        フレーバー図鑑
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        ブランド別のフレーバー一覧。タップすると、そのフレーバーを使ったミックスと購入リンクが見られます。
      </p>

      {brands.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          まだフレーバーが登録されていません。
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {brands.map((brand) => (
            <section key={brand}>
              <h2 className="mb-3 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>
                {brand}
              </h2>
              <div className="flex flex-wrap gap-2">
                {byBrand.get(brand)!.map((f) => (
                  <Link key={f.id} href={`/flavor/${f.id}`} className="chip">
                    {f.name}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
