'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type FlavorLite = { id: string; brand: string; name: string; count: number }

/** フレーバー図鑑のブランド別一覧＋インクリメンタル検索（クライアント）。 */
export function FlavorSearch({ flavors }: { flavors: FlavorLite[] }) {
  const [q, setQ] = useState('')

  const { brands, byBrand, hits } = useMemo(() => {
    const term = q.trim().toLowerCase()
    const filtered = term
      ? flavors.filter((f) => f.name.toLowerCase().includes(term) || f.brand.toLowerCase().includes(term))
      : flavors
    const map = new Map<string, FlavorLite[]>()
    for (const f of filtered) {
      const arr = map.get(f.brand) ?? []
      arr.push(f)
      map.set(f.brand, arr)
    }
    return { brands: [...map.keys()].sort((a, b) => a.localeCompare(b, 'ja')), byBrand: map, hits: filtered.length }
  }, [q, flavors])

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="フレーバー名・ブランドで検索"
          aria-label="フレーバー検索"
          className="min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ background: '#fff', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="btn btn-ghost shrink-0 text-sm" aria-label="検索をクリア">
            クリア
          </button>
        )}
      </div>

      {hits === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          「{q}」に一致するフレーバーはありません。
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {brands.map((brand) => (
            <section key={brand}>
              <Link
                href={`/brand/${encodeURIComponent(brand)}`}
                className="mb-3 inline-block text-sm transition-colors hover:text-[var(--color-ember-hot)]"
                style={{ fontWeight: 700, color: 'var(--color-ash)' }}
              >
                {brand} <span style={{ color: 'var(--color-ember-hot)' }}>›</span>
              </Link>
              <div className="flex flex-wrap gap-2">
                {byBrand.get(brand)!.map((f) => (
                  <Link key={f.id} href={`/flavor/${f.id}`} className="chip">
                    {f.name}
                    {f.count > 0 && <span style={{ color: 'var(--color-ash-dim)' }}> · {f.count}</span>}
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
