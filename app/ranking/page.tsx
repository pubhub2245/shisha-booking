import Link from 'next/link'
import { getMixes, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '人気ランキング — MixHub',
  description: 'いいねが多い人気のシーシャ ミックスランキング。',
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function RankingPage() {
  const [mixes, likedIds, user] = await Promise.all([
    getMixes({ sort: 'popular' }),
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
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        みんなの「いいね」が多い順。迷ったら上位から試すのがおすすめ。
      </p>

      {mixes.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          まだランキングデータがありません。
        </div>
      ) : (
        <>
          {/* TOP3 */}
          <div className="mt-8 grid gap-4">
            {top3.map((m, i) => (
              <Link key={m.id} href={`/mix/${m.id}`} className="card card-hover flex items-center gap-4 p-5">
                <span className="text-3xl">{MEDALS[i]}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-1.5 text-sm" style={{ color: 'var(--color-ash)' }}>
                    {(m.mix_flavors ?? []).slice(0, 3).map((f, j) => (
                      <span key={f.id}>
                        {j > 0 && <span style={{ color: 'var(--color-ember)' }}> × </span>}
                        {f.name}
                      </span>
                    ))}
                  </div>
                  <div className="truncate" style={{ fontWeight: 700 }}>{m.title}</div>
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
