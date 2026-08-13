import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getFlavorById,
  getMixesUsingFlavor,
  getLikedMixIds,
  getMyShelfFlavorIds,
  getShopsWithFlavor,
  getMyShops,
  getFlavorAdder,
  getFlavorRating,
  getFlavorLogs,
  getPublicFlavorLogs,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { ShelfButton } from '@/components/shelf-button'
import { FlavorRating } from '@/components/flavor-rating'
import { FlavorLogForm } from '@/components/flavor-log-form'
import { LogHelpfulButton } from '@/components/log-helpful-button'
import { deleteFlavorLog, toggleBestLog, togglePublicLog } from '@/actions/flavor-log'
import { hmsLabel, charcoalLabel, packLabel } from '@/lib/heat'
import { Avatar } from '@/components/avatar'
import { VerifiedBadge } from '@/components/verified-badge'
import { goHref } from '@/lib/go'
import { flavorKey } from '@/lib/combo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const flavor = await getFlavorById(id)
  if (!flavor) return { title: 'フレーバーが見つかりません — 煙道' }
  return {
    title: `${flavor.brand} ${flavor.name} を使ったミックス — 煙道`,
    description: `${flavor.brand} ${flavor.name} を使ったシーシャのミックス一覧。`,
  }
}

export default async function FlavorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const flavor = await getFlavorById(id)
  if (!flavor) notFound()

  const [mixes, likedIds, user, shelfIds, shops, adder, rating, logs, publicLogs, myShops] = await Promise.all([
    getMixesUsingFlavor(flavor),
    getLikedMixIds(),
    getCurrentUser(),
    getMyShelfFlavorIds(),
    getShopsWithFlavor(flavor),
    flavor.added_by ? getFlavorAdder(flavor.added_by) : Promise.resolve(null),
    getFlavorRating(flavor.id),
    getFlavorLogs(flavor.id),
    getPublicFlavorLogs(flavor.id),
    getMyShops(),
  ])
  // 練習ログのサマリー・散布図データ
  const ratedLogs = logs.filter((l) => l.rating != null)
  const avgLogRating = ratedLogs.length
    ? ratedLogs.reduce((a, b) => a + (b.rating ?? 0), 0) / ratedLogs.length
    : 0
  const scatter = logs.filter((l) => l.steep_heat != null && l.rating != null)
  const bestLog = logs.find((l) => l.is_best) ?? null
  // 集合知：高評価(★4+)ログの到達火力から「みんなの好評ゾーン」を算出
  const goodHeat = [...logs, ...publicLogs]
    .filter((l) => l.steep_heat != null && (l.rating ?? 0) >= 4)
    .map((l) => l.steep_heat as number)
    .sort((a, b) => a - b)
  const pct = (arr: number[], p: number) => {
    if (arr.length === 0) return 0
    const i = (arr.length - 1) * p
    const lo = Math.floor(i)
    const hi = Math.ceil(i)
    return arr[lo] + (arr[hi] - arr[lo]) * (i - lo)
  }
  const heatZone =
    goodHeat.length >= 3
      ? {
          lo: Math.round(pct(goodHeat, 0.25)),
          mid: Math.round(pct(goodHeat, 0.5)),
          hi: Math.round(pct(goodHeat, 0.75)),
          n: goodHeat.length,
        }
      : null
  const buyUrl = goHref(flavor.affiliate_url, { f: flavor.id })

  // よく一緒に使われるフレーバー（共起）
  const selfKey = flavorKey(flavor.brand, flavor.name)
  const coMap = new Map<string, { count: number; name: string; brand: string | null; fid: string | null }>()
  for (const m of mixes) {
    for (const f of m.mix_flavors ?? []) {
      const k = flavorKey(f.brand, f.name)
      if (k === selfKey) continue
      const e = coMap.get(k) ?? { count: 0, name: f.name, brand: f.brand, fid: f.flavor_id ?? null }
      e.count++
      if (!e.fid && f.flavor_id) e.fid = f.flavor_id
      coMap.set(k, e)
    }
  }
  const coUsed = [...coMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        ← フレーバー図鑑
      </Link>

      <div className="card mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</div>
          <h1 className="text-2xl" style={{ fontWeight: 800 }}>{flavor.name}</h1>
          <div className="mt-2">
            <FlavorRating
              flavorId={flavor.id}
              initialAvg={rating.avg}
              initialCount={rating.count}
              initialMine={rating.mine}
              isAuthed={!!user}
            />
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            <span>追加:</span>
            {adder ? (
              <Link
                href={adder.username ? `/u/${adder.username}` : '#'}
                className="inline-flex items-center gap-1"
                style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
              >
                {adder.display_name || (adder.username ? `@${adder.username}` : 'ユーザー')}
                {adder.is_pro && <VerifiedBadge size={11} />}
              </Link>
            ) : (
              <span>煙道 編集部</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShelfButton
            flavorId={flavor.id}
            initialOwned={shelfIds.has(flavor.id)}
            isAuthed={!!user}
            nextPath={`/flavor/${flavor.id}`}
          />
          {buyUrl && (
            <a href={buyUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ember">
              このフレーバーを購入する
            </a>
          )}
        </div>
      </div>

      {/* ---------- 練習ログ（フレーバーをこする） ---------- */}
      <section className="mt-8">
        <h2 className="text-lg" style={{ fontWeight: 700 }}>🔬 あなたの練習ログ</h2>
        <p className="mb-3 mt-1 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          同じフレーバーを繰り返し作って（“こする”）、得意な温度帯・味の出方を研究する非公開ノートです。
        </p>

        {heatZone && (
          <div className="card mb-4 p-5">
            <div className="text-sm" style={{ fontWeight: 700 }}>🌡️ みんなの好評ゾーン（到達火力）</div>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              高評価（★4以上）{heatZone.n}件から算出 ・ 中央値{' '}
              <b style={{ color: 'var(--color-ember-hot)' }}>{heatZone.mid}</b> ／ 好評帯 {heatZone.lo}〜{heatZone.hi}
            </p>
            <svg viewBox="0 0 320 40" width="100%" style={{ maxWidth: 440 }} className="mt-2" role="img" aria-label="好評の火力帯">
              <rect x="0" y="8" width="320" height="14" rx="7" fill="var(--line)" />
              <rect x={(heatZone.lo / 100) * 320} y="8" width={((heatZone.hi - heatZone.lo) / 100) * 320} height="14" rx="7" fill="var(--color-ember)" fillOpacity="0.5" />
              <line x1={(heatZone.mid / 100) * 320} x2={(heatZone.mid / 100) * 320} y1="4" y2="26" stroke="var(--color-ember-hot)" strokeWidth="2" />
              {[0, 50, 100].map((t) => (
                <text key={t} x={(t / 100) * 320} y="37" textAnchor={t === 0 ? 'start' : t === 100 ? 'end' : 'middle'} fontSize="8" fill="var(--color-ash-dim)">{t}</text>
              ))}
            </svg>
          </div>
        )}

        {user ? (
          <>
            {bestLog && (
              <div className="card mb-3 p-5" style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)' }}>
                <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ember-hot)' }}>👑 あなたのベスト設定</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bestLog.steep_heat != null && <span className="chip" style={{ fontSize: '0.72rem' }}>🔥到達{bestLog.steep_heat}</span>}
                  {bestLog.steep_minutes != null && <span className="chip" style={{ fontSize: '0.72rem' }}>♨️蒸らし{bestLog.steep_minutes}分</span>}
                  {hmsLabel(bestLog.hms_type) && <span className="chip" style={{ fontSize: '0.72rem' }}>{hmsLabel(bestLog.hms_type)}</span>}
                  {charcoalLabel(bestLog.charcoal_type) && <span className="chip" style={{ fontSize: '0.72rem' }}>炭:{charcoalLabel(bestLog.charcoal_type)}</span>}
                  {packLabel(bestLog.pack_style) && <span className="chip" style={{ fontSize: '0.72rem' }}>盛り:{packLabel(bestLog.pack_style)}</span>}
                  {bestLog.rating != null && <span style={{ color: '#f5a623' }}>{'★'.repeat(bestLog.rating)}</span>}
                </div>
                {bestLog.result_note && (
                  <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>{bestLog.result_note}</p>
                )}
              </div>
            )}
            {logs.length > 0 && (
              <div className="card mb-3 p-5">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span>これまで <b>{logs.length}</b> 回</span>
                  {ratedLogs.length > 0 && (
                    <span>平均の出来 <b style={{ color: 'var(--color-ember-hot)' }}>★{avgLogRating.toFixed(1)}</b></span>
                  )}
                </div>

                {scatter.length >= 2 && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                      到達火力 × 出来 — 高評価が集まる火力帯が「得意温度帯」
                    </p>
                    <svg viewBox="0 0 320 150" width="100%" style={{ maxWidth: 440 }} role="img" aria-label="到達火力と出来の散布図">
                      {[1, 2, 3, 4, 5].map((r) => {
                        const y = 10 + (1 - (r - 1) / 4) * (150 - 10 - 24)
                        return (
                          <g key={r}>
                            <line x1={28} x2={310} y1={y} y2={y} stroke="var(--line)" />
                            <text x={24} y={y + 3} textAnchor="end" fontSize="8" fill="var(--color-ash-dim)">★{r}</text>
                          </g>
                        )
                      })}
                      {[0, 50, 100].map((h) => {
                        const x = 28 + (h / 100) * (320 - 28 - 10)
                        return (
                          <text key={h} x={x} y={144} textAnchor="middle" fontSize="8" fill="var(--color-ash-dim)">{h}</text>
                        )
                      })}
                      <text x={310} y={144} textAnchor="end" fontSize="8" fill="var(--color-ash-dim)">火力→</text>
                      {scatter.map((l) => {
                        const x = 28 + ((l.steep_heat ?? 0) / 100) * (320 - 28 - 10)
                        const y = 10 + (1 - ((l.rating ?? 1) - 1) / 4) * (150 - 10 - 24)
                        return <circle key={l.id} cx={x} cy={y} r="4" fill="var(--color-ember)" fillOpacity="0.65" stroke="#fff" strokeWidth="1" />
                      })}
                    </svg>
                  </div>
                )}
              </div>
            )}

            <FlavorLogForm flavorId={flavor.id} shops={myShops.map((s) => ({ id: s.id, name: s.name }))} />

            {logs.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {logs.map((l) => {
                  const chips: string[] = []
                  if (l.steep_minutes != null) chips.push(`♨️蒸らし${l.steep_minutes}分`)
                  if (l.steep_heat != null) chips.push(`🔥到達${l.steep_heat}`)
                  if (hmsLabel(l.hms_type)) chips.push(hmsLabel(l.hms_type)!)
                  if (charcoalLabel(l.charcoal_type)) chips.push(`炭:${charcoalLabel(l.charcoal_type)}`)
                  if (packLabel(l.pack_style)) chips.push(`盛り:${packLabel(l.pack_style)}`)
                  return (
                    <div key={l.id} className="card p-4" style={l.is_best ? { borderColor: 'var(--color-ember)' } : undefined}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ fontWeight: 700 }}>
                          {l.is_best && <span style={{ color: 'var(--color-ember-hot)' }}>👑 ベスト</span>}
                          <span>{l.logged_at}</span>
                          {l.rating != null && <span style={{ color: '#f5a623' }}>{'★'.repeat(l.rating)}</span>}
                          {l.is_public && <span className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>🌐 公開中</span>}
                        </div>
                      </div>
                      {chips.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {chips.map((c, i) => (
                            <span key={i} className="chip" style={{ fontSize: '0.7rem' }}>{c}</span>
                          ))}
                        </div>
                      )}
                      {l.result_note && (
                        <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>{l.result_note}</p>
                      )}
                      {l.change_note && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>変更点：{l.change_note}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                        <form action={toggleBestLog}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="flavor_id" value={flavor.id} />
                          <button type="submit" className="text-xs" style={{ color: l.is_best ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)', fontWeight: 600 }}>
                            {l.is_best ? '👑 ベスト解除' : '👑 ベストにする'}
                          </button>
                        </form>
                        <form action={togglePublicLog}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="flavor_id" value={flavor.id} />
                          <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                            {l.is_public ? '🌐 公開をやめる' : '🌐 公開して共有'}
                          </button>
                        </form>
                        <form action={deleteFlavorLog}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="flavor_id" value={flavor.id} />
                          <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="card p-5 text-sm" style={{ color: 'var(--color-ash)' }}>
            ログインすると、このフレーバーを繰り返し研究する練習ノート（熱設定・味の出方・評価）を記録できます。{' '}
            <Link href={`/login?next=/flavor/${flavor.id}`} style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              ログイン
            </Link>
          </div>
        )}

        {publicLogs.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm" style={{ fontWeight: 700 }}>🌐 みんなの研究メモ（公開）</h3>
            <div className="flex flex-col gap-2">
              {publicLogs.map((l) => {
                const chips: string[] = []
                if (l.steep_heat != null) chips.push(`🔥到達${l.steep_heat}`)
                if (l.steep_minutes != null) chips.push(`♨️蒸らし${l.steep_minutes}分`)
                if (hmsLabel(l.hms_type)) chips.push(hmsLabel(l.hms_type)!)
                if (packLabel(l.pack_style)) chips.push(`盛り:${packLabel(l.pack_style)}`)
                return (
                  <div key={l.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
                      <Avatar name={l.author?.display_name || l.author?.username} seed={l.user_id} size={22} />
                      {l.author?.username ? (
                        <Link href={`/u/${l.author.username}`} className="hover:underline" style={{ color: 'var(--color-ember-hot)' }}>
                          {l.author.display_name || `@${l.author.username}`}
                        </Link>
                      ) : (
                        <span>{l.author?.display_name || '名無し'}</span>
                      )}
                      {l.is_best && <span className="text-xs" style={{ color: 'var(--color-ember-hot)' }}>👑ベスト</span>}
                      {l.rating != null && <span style={{ color: '#f5a623' }}>{'★'.repeat(l.rating)}</span>}
                    </div>
                    {chips.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {chips.map((c, i) => (
                          <span key={i} className="chip" style={{ fontSize: '0.7rem' }}>{c}</span>
                        ))}
                      </div>
                    )}
                    {l.result_note && (
                      <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>{l.result_note}</p>
                    )}
                    <div className="mt-2">
                      <LogHelpfulButton
                        logId={l.id}
                        flavorId={flavor.id}
                        initialCount={l.helpful_count}
                        initialHelpful={l.my_helpful}
                        isAuthed={!!user}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* ---------- 取り扱い店舗（来店誘導） ---------- */}
      {shops.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>
            🏠 このフレーバーがあるお店（{shops.length}）
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {shops.map((s) => (
              <Link key={s.id} href={`/shop/${s.id}`} className="card card-hover flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <span className="block truncate text-sm" style={{ fontWeight: 700 }}>{s.name}</span>
                  {s.area && (
                    <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>📍 {s.area}</div>
                  )}
                </div>
                <span className="shrink-0 text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>メニュー →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {coUsed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>🤝 よく一緒に使われるフレーバー</h2>
          <div className="flex flex-wrap gap-2">
            {coUsed.map((c) =>
              c.fid ? (
                <Link key={c.fid} href={`/flavor/${c.fid}`} className="chip">
                  {c.name} <span style={{ color: 'var(--color-ash-dim)' }}>×{c.count}</span>
                </Link>
              ) : (
                <span key={c.name} className="chip">
                  {c.name} <span style={{ color: 'var(--color-ash-dim)' }}>×{c.count}</span>
                </span>
              )
            )}
          </div>
        </section>
      )}

      <h2 className="mb-4 mt-8 text-lg" style={{ fontWeight: 700 }}>
        このフレーバーを使ったミックス（{mixes.length}）
      </h2>
      {mixes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {mixes.map((m) => (
            <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            まだこのフレーバーを使ったミックスがありません。
          </p>
          <Link href="/post" className="btn btn-ember mt-4">＋ 最初のミックスを投稿</Link>
        </div>
      )}
      {buyUrl && (
        <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 購入リンクにはアフィリエイトを含む場合があります。
        </p>
      )}
    </div>
  )
}
