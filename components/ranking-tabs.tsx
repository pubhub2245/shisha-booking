import Link from 'next/link'

/**
 * ランキング系ページ（王道／地域別）を1つの家族として束ねるタブ。
 * 「良い順に並べる場所」が複数あって迷う問題への対策：各ページ上部に共通表示する。
 */
const TABS = [
  { key: 'national', href: '/national', label: '王道', hint: 'フレーバーごとの王道' },
  { key: 'areas', href: '/areas', label: '地域別', hint: '地方ごと・旅行先の名店' },
] as const

export function RankingTabs({ current }: { current: 'national' | 'areas' }) {
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
