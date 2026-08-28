import Link from 'next/link'

/**
 * 王道ページを1つの家族として束ねるタブ。
 * 「良い順に並べる場所」が複数あって迷う問題への対策：各ページ上部に共通表示する。
 */
const TABS = [
  { key: 'national', href: '/national', label: '王道', hint: 'フレーバーごとの王道' },
] as const

export function RankingTabs({ current }: { current: 'national' }) {
  const active = TABS.find((t) => t.key === current)
  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={t.href} className={`chip ${t.key === current ? 'chip-active' : ''}`}>
            {t.label}
          </Link>
        ))}
      </div>
      {active && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {active.hint}
        </p>
      )}
    </div>
  )
}
