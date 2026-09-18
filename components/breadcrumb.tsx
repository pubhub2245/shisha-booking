import Link from 'next/link'

/** 画面に出すパンくず。JSON-LD と同じ並びを渡す（機械と人で食い違わせない）。 */
export function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="パンくず" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
      {items.map((it, i) => (
        <span key={`${it.name}-${i}`}>
          {i > 0 && <span aria-hidden="true"> / </span>}
          {it.href ? (
            <Link href={it.href} style={{ color: 'var(--color-ash-dim)' }}>{it.name}</Link>
          ) : (
            <span aria-current="page">{it.name}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
