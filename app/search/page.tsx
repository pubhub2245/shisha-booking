import Link from 'next/link'
import type { Metadata } from 'next'
import { searchMixes, searchFlavors, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '検索',
  description: '作り方・フレーバーを検索。',
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const [mixes, flavors, likedIds, user] = query
    ? await Promise.all([searchMixes(query), searchFlavors(query), getLikedMixIds(), getCurrentUser()])
    : [[], [], new Set<string>(), null]

  return (
    <div className="wrap max-w-3xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>検索</h1>

      <form action="/search" method="get" className="mt-4 flex items-center gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="作り方・フレーバー・タグで検索"
          aria-label="検索"
          autoFocus
          className="min-h-11 min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
        <button type="submit" className="btn btn-ember shrink-0 text-sm">検索</button>
      </form>

      {!query ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          フレーバー名（例：ダブルアップル）、味わい（例：さっぱり）、キーワードで探せます。
        </p>
      ) : (
        <>
          {flavors.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm eyebrow">フレーバー（{flavors.length}）</h2>
              <div className="flex flex-wrap gap-2">
                {flavors.map((f) => (
                  <Link key={f.id} href={`/flavor/${f.id}`} className="chip">
                    <span style={{ color: 'var(--color-ash-dim)' }}>{f.brand}</span>&nbsp;{f.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-4 text-sm eyebrow">作り方（{mixes.length}）</h2>
            {mixes.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {mixes.map((m) => (
                  <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
                「{query}」に一致する作り方は見つかりませんでした。
                {flavors.length === 0 && <><br />別のキーワードでお試しください。</>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
