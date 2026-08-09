import Link from 'next/link'
import { getFlavorsWithUsage } from '@/lib/queries'
import { FlavorSearch } from '@/components/flavor-search'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'フレーバー図鑑 — MixHub',
  description: 'シーシャのフレーバーを一覧。ブランド別に探して、使われているミックスや購入リンクをチェック。',
}

export default async function FlavorsPage() {
  const flavors = await getFlavorsWithUsage()
  const popular = [...flavors].filter((f) => f.count > 0).sort((a, b) => b.count - a.count).slice(0, 10)
  const lite = flavors.map((f) => ({ id: f.id, brand: f.brand, name: f.name, count: f.count }))

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Flavor directory</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        フレーバー図鑑
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        タップすると、そのフレーバーを使ったミックスと購入リンクが見られます。
        現在 <b>{flavors.length}</b> 種を掲載。図鑑は作り手みんなで育てるもので、
        <Link href="/founders" className="hover:underline" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>認証プロ・創設メンバー</Link>
        は投稿時に新しいフレーバーを追加できます。
      </p>

      {lite.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          まだフレーバーが登録されていません。
        </div>
      ) : (
        <>
          {popular.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>🔥 よく使われる</h2>
              <div className="flex flex-wrap gap-2">
                {popular.map((f) => (
                  <Link key={f.id} href={`/flavor/${f.id}`} className="chip chip-active">
                    {f.name} <span style={{ opacity: 0.7 }}>{f.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8">
            <FlavorSearch flavors={lite} />
          </div>
        </>
      )}
    </div>
  )
}
