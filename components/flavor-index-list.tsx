import Link from 'next/link'
import { Gauge } from '@/components/gauge'
import type { IndexedFlavor } from '@/lib/flavor-index'

/**
 * 索引ページの一覧。何通りで作られているかを、数字より先に「熱の目盛り」の
 * 厚みで見せる（署名要素は増やさない）。並びは実績順で、上に来たものが「まずこれ」。
 */
export function FlavorIndexList({ items }: { items: IndexedFlavor[] }) {
  const max = Math.max(1, ...items.map((f) => f.methodCount))
  return (
    <ul className="mt-4 grid gap-2">
      {items.map((f) => (
        <li key={f.id}>
          <Link
            href={`/flavor/${f.id}`}
            className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3"
            style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)' }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs" style={{ color: 'var(--color-ash-dim)' }}>{f.brand}</span>
              <span className="block text-sm" style={{ color: 'var(--color-cream)', fontWeight: 600 }}>{f.name}</span>
            </span>
            <span className="shrink-0 text-right">
              <Gauge n={f.methodCount} max={max} />
              <span className="mt-1 block text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                作り方 {f.methodCount}
                {f.makerCount > 0 ? ` ／ 作った人 ${f.makerCount}` : ''}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
