import Link from 'next/link'

/**
 * ランキング系ページ（日本代表／地域別／人気）を1つの家族として束ねるタブ。
 * 「良い順に並べる場所」が複数あって迷う問題への対策：各ページ上部に共通表示する。
 */
const TABS = [
  { key: 'national', href: '/national', label: '🇯🇵 日本代表', hint: '組み合わせごとの日本一' },
  { key: 'areas', href: '/areas', label: '📍 地域別', hint: '地方ごと・旅行先の名店' },
  { key: 'ranking', href: '/ranking', label: '🔥 人気', hint: 'いいねが多い順' },
] as const

export function RankingTabs({ current }: { current: 'national' | 'areas' | 'ranking' }) {
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
