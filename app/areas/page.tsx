import Link from 'next/link'
import { getAreaRankings, getNearbyShops, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { NearbyShops } from '@/components/nearby-shops'
import { Avatar } from '@/components/avatar'
import { RankingTabs } from '@/components/ranking-tabs'
import { EmptyState } from '@/components/empty-state'
import { flavorLine } from '@/lib/mix'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '地域別ランキング',
  description:
    '地方ごとの作り方＆お店ランキング。旅行先で一番美味しいシーシャ屋さんを見つけよう。都会だけが有利にならない、地域対抗の図鑑。',
}

const MEDALS = ['壱', '弐', '参']

export default async function AreasPage() {
  const [regions, nearby, likedIds, user] = await Promise.all([
    getAreaRankings(),
    getNearbyShops(),
    getLikedMixIds(),
    getCurrentUser(),
  ])

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Area Ranking</p>
      <h1 className="mt-2 mb-4 text-3xl" style={{ fontWeight: 800 }}>
        地域別ランキング
      </h1>

      <RankingTabs current="areas" />

      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        シーシャ人口の多い都会ほど「いいね」が集まりやすい——その偏りをなくすため、<b>地方ごと</b>に分けて育てます。
        旅行や出張のときは、その地域で<b>いま一番評価されているお店</b>を探すのに使ってください。
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        お店の順位は <b>実地評価（現地で吸った票）</b>を最重視して算出しています。
      </p>

      {/* 現在地から近い高評価店（旅行者導線） */}
      <NearbyShops shops={nearby} />

      {regions.length === 0 ? (
        <EmptyState
          title="まだ地域別のデータがありません"
          action={<Link href="/shops" className="btn btn-ghost">お店一覧へ</Link>}
        >
          お店の管理画面から<b>都道府県</b>を登録すると、その地域のランキングに載ります。
        </EmptyState>
      ) : (
        <>
          {/* 地方ジャンプ */}
          <div className="mt-5 flex flex-wrap gap-2">
            {regions.map((r) => (
              <a key={r.region} href={`#${r.region}`} className="chip">
                {r.region}
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-12">
            {regions.map((r) => (
              <section key={r.region} id={r.region} className="scroll-mt-20">
                <h2 className="flex items-center gap-2 text-2xl" style={{ fontWeight: 800 }}>
                  {r.region}
                </h2>

                {/* ---------- お店ランキング ---------- */}
                {r.shops.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm eyebrow">Shops — 美味しいと評価されているお店</h3>
                    <div className="grid gap-3">
                      {r.shops.map((it, i) => (
                        <Link
                          key={it.shop.id}
                          href={`/shop/${it.shop.id}`}
                          className="card card-hover flex items-center gap-3 p-4"
                        >
                          <span className="w-7 shrink-0 text-center text-2xl">
                            {MEDALS[i] ?? <span className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>{i + 1}</span>}
                          </span>
                          <Avatar name={it.shop.name} seed={it.shop.id} size={40} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate" style={{ fontWeight: 700 }}>{it.shop.name}</span>
                              {i === 0 && it.score > 0 && (
                                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.62rem]" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 800 }}>
                                  地域No.1
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                              <span>{it.shop.area || it.shop.prefecture}</span>
                              {it.onsite > 0 && (
                                <span style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>実地 {it.onsite}</span>
                              )}
                              {it.topMix && (
                                <span className="truncate">代表作：{flavorLine(it.topMix.mix_flavors)}</span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs" style={{ color: 'var(--color-ash)', fontWeight: 700 }}>
                            {it.score}pt
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---------- ミックスランキング ---------- */}
                {r.mixes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm eyebrow">Methods — この地域の注目の作り方</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {r.mixes.map((x, i) => (
                        <div key={x.mix.id} className="relative">
                          {i === 0 && x.score >= 1 && (
                            <span
                              className="absolute -top-2 left-3 z-10 rounded-full px-2 py-0.5 text-[0.62rem]"
                              style={{ background: 'linear-gradient(90deg, var(--color-ember), var(--color-ember-deep))', color: '#fff', fontWeight: 800, boxShadow: '0 4px 10px -4px rgb(224 85 42 / 0.6)' }}
                            >
                              {r.region}の王道
                            </span>
                          )}
                          <MixCard mix={x.mix} liked={likedIds.has(x.mix.id)} isAuthed={!!user} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 rounded-xl border p-5 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--color-ash)' }}>
        <p style={{ fontWeight: 700, color: 'var(--color-cream)' }}>あなたのお店を地域ランキングに載せるには</p>
        <p className="mt-1 text-xs leading-relaxed">
          お店の管理画面 →「店舗情報」で<b>都道府県</b>と<b>お店の位置</b>を登録してください。
          位置を登録すると、来店者が現地で「実地評価」を押せるようになり、順位に反映されます。
        </p>
        <Link href="/shops" className="btn btn-ghost mt-3 text-sm">お店一覧へ</Link>
      </div>
    </div>
  )
}
