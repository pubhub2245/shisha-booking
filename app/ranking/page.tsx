import Link from 'next/link'
import { getRankedMixes, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { RankingTabs } from '@/components/ranking-tabs'
import { EmptyState } from '@/components/empty-state'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '人気ランキング — 煙道',
  description: 'いいねが多い人気のシーシャ ミックスランキング。週間・月間・全期間。',
}

const MEDALS = ['🥇', '🥈', '🥉']
const PERIODS = [
  { v: 'week', l: '週間' },
  { v: 'month', l: '月間' },
  { v: 'all', l: '全期間' },
] as const

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams
  const period: 'week' | 'month' | 'all' =
    sp.period === 'week' ? 'week' : sp.period === 'month' ? 'month' : 'all'
  const [mixes, likedIds, user] = await Promise.all([
    getRankedMixes(period),
    getLikedMixIds(),
    getCurrentUser(),
  ])
  const top3 = mixes.slice(0, 3)
  const rest = mixes.slice(3)

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Ranking</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        人気ミックスランキング
      </h1>
      <p className="mt-2 mb-4 text-sm" style={{ color: 'var(--color-ash)' }}>
        みんなの「いいね」が多い順。迷ったら上位から試すのがおすすめ。
        <span className="ml-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>（🌐 公開レシピをわずかに優先）</span>
      </p>

      <RankingTabs current="ranking" />

      <div className="mt-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.v}
            href={p.v === 'all' ? '/ranking' : `/ranking?period=${p.v}`}
            className={`chip ${period === p.v ? 'chip-active' : ''}`}
          >
            {p.l}
          </Link>
        ))}
      </div>

      {mixes.length === 0 ? (
        <EmptyState
          icon="🏆"
          title={period === 'all' ? 'まだランキングデータがありません' : 'この期間の「いいね」はまだありません'}
          action={<Link href="/post" className="btn btn-ember">＋ ミックスを投稿</Link>}
        >
          ミックスに👍が集まると、人気順に並びます。
        </EmptyState>
      ) : (
        <>
          {/* TOP3 */}
          <div className="mt-8 grid gap-4">
            {top3.map((m, i) => (
              <Link key={m.id} href={`/mix/${m.id}`} className="card card-hover flex items-center gap-4 p-5">
                <span className="text-3xl">{MEDALS[i]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 leading-snug" style={{ fontWeight: 700 }}>
                    {(m.mix_flavors ?? []).slice(0, 3).map((f, j) => (
                      <span key={f.id}>
                        {j > 0 && <span style={{ color: 'var(--color-ember)', fontWeight: 400 }}> × </span>}
                        {f.name}
                      </span>
                    ))}
                  </div>
                  {m.title && (
                    <div className="mt-0.5 text-sm" style={{ color: 'var(--color-ash-dim)' }}>{m.title}</div>
                  )}
                </div>
                <span className="shrink-0 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                  ❤️ {m.like_count}
                </span>
              </Link>
            ))}
          </div>

          {/* 4位以降 */}
          {rest.length > 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {rest.map((m) => (
                <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
