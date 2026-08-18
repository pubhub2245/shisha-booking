import Link from 'next/link'
import type { Metadata } from 'next'
import { getThemeOverview, getMyThemeMade, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { DesignSpaceMap } from '@/components/design-space-map'
import { HeatCurveChart, type CurveSeries } from '@/components/heat-curve-chart'
import { CURVE_COLORS } from '@/lib/heat'
import { FIRST_THEME, themeComboSlug } from '@/lib/theme'
import { buildDesignSpace, diffMethods, describeDiff, rankNextCandidates } from '@/lib/method-diff'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `今月の煙道検証 — ${FIRST_THEME.title} — 煙道`,
  description: `${FIRST_THEME.title} の作り方を、みんなで試して比べています。${FIRST_THEME.lead}`,
}

const label = (m: { id: string; title: string | null }) => m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`

export default async function ThemePage() {
  const [overview, myMade, likedIds, user] = await Promise.all([
    getThemeOverview(FIRST_THEME.comboKey),
    getMyThemeMade(FIRST_THEME.comboKey),
    getLikedMixIds(),
    getCurrentUser(),
  ])

  const { methods, stats, progress } = overview
  const madeIds = new Set(myMade.map((r) => r.mixId))
  const myLatest = myMade[0] ? methods.find((m) => m.id === myMade[0].mixId) ?? null : null

  // 設計空間の地図。他人の体験データを使わないので、参加者が0人でも成立する。
  const space = buildDesignSpace(methods, myLatest)

  // まだ試していない作り方のうち、いま作った一台と差が小さいもの
  const next = myLatest
    ? rankNextCandidates(myLatest, methods, {
        madeIds,
        makerCount: (id) => stats.get(id)?.makerCount ?? 0,
      }).filter((c) => !madeIds.has(c.method.id))
    : []

  const curveSeries: CurveSeries[] = methods
    .filter((m) => Array.isArray(m.heat_curve) && m.heat_curve.length >= 2)
    .slice(0, 6)
    .map((m, i) => ({
      label: label(m).length > 16 ? label(m).slice(0, 16) + '…' : label(m),
      color: CURVE_COLORS[i % CURVE_COLORS.length],
      points: m.heat_curve!,
    }))

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← 図鑑にもどる</Link>

      {/* ---------- HEADER ---------- */}
      <header className="mt-4 fade-up">
        <p className="eyebrow">今月の煙道検証</p>
        <h1 className="mt-2 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
          {FIRST_THEME.brand}
          <br />
          {FIRST_THEME.flavor} 100%
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
          {FIRST_THEME.lead}
        </p>
      </header>

      {/* ---------- なぜこのテーマなのか ---------- */}
      <section className="card mt-6 p-5">
        <h2 className="text-sm eyebrow">なぜ、ダブルアップル100%なのか</h2>
        <div className="mt-2 flex flex-col gap-1.5">
          {FIRST_THEME.why.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* ---------- いまの状況（数字を主役にしない） ---------- */}
      <p className="mt-5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        検証中の作り方 {progress.methodCount}
        {progress.participants > 0 && <> ・ 作った人 {progress.participants}</>}
        {progress.multiMethod > 0 && <> ・ 2つ以上作った人 {progress.multiMethod}</>}
      </p>

      {/* ---------- 主導線 ---------- */}
      {methods.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            検証する作り方をこれから集めます。
            <br />
            同じフレーバーでも、ボウル・詰め方・炭・火入れで一台は変わります。
          </p>
          <Link href={`/post?combo=${themeComboSlug()}`} className="btn btn-ember">
            自分の作り方を登録する
          </Link>
        </div>
      ) : (
        <section className="card mt-6 p-5">
          {myMade.length === 0 ? (
            <>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>まず、あなたの基準になる一台を。</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                いきなり投稿は要りません。<strong>いつもの一台を、誰かのやり方に置き換えてみる</strong>だけです。
                自分のやり方に近いものを1つ選んで、普段どおり作ってみてください。
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {methods.slice(0, 2).map((m) => (
                  <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                あなたはこのテーマで {myMade.length} 通り試しています。
              </h2>
              {next.length > 0 ? (
                <>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
                    次に試すと違いが分かりやすいのは、この作り方です。
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {next.slice(0, 2).map((c) => (
                      <Link
                        key={c.method.id}
                        href={`/mix/${c.method.id}`}
                        className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 transition-colors"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <span className="text-sm" style={{ fontWeight: 700 }}>{label(c.method)}</span>
                        <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                          {c.diffs.map(describeDiff).join('／')}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.7rem]" style={{ color: 'var(--color-ash-dim)' }}>
                    次にシーシャを作るときで大丈夫です。
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
                  いまの検証対象は一通り試しました。あなたのやり方も登録できます。
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* ---------- 設計空間の地図 ---------- */}
      {space.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">Design space — 作り手たちの散らばり</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            どれが正解かではなく、いま何がどこまで試されているか。
            {myLatest && <>あなたが最後に作った一台の位置を重ねています。</>}
          </p>
          <div className="card p-5">
            <DesignSpaceMap axes={space} />
          </div>
        </section>
      )}

      {/* ---------- 熱カーブ比較 ---------- */}
      {curveSeries.length >= 2 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">Heat comparison — 熱カーブ比較</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            同じフレーバーでも、作り手ごとに熱の入れ方が違います。
          </p>
          <div className="card p-5">
            <HeatCurveChart series={curveSeries} />
          </div>
        </section>
      )}

      {/* ---------- 検証対象の一覧 ---------- */}
      {methods.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">検証中の作り方（{methods.length}）</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            人気順ではありません。まだ誰も試していない作り方にも、同じだけ意味があります。
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {methods.map((m) => {
              const s = stats.get(m.id)
              const diffs = myLatest && myLatest.id !== m.id ? diffMethods(myLatest, m) : []
              return (
                <div key={m.id} className="flex flex-col gap-1.5">
                  <MixCard mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
                    {madeIds.has(m.id) && (
                      <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                        作った
                      </span>
                    )}
                    {diffs.length > 0 && diffs.length <= 2 && (
                      <span className="text-xs" style={{ color: 'var(--color-ash)' }}>
                        あなたの一台と {diffs.map((d) => d.label).join('・')} が違います
                      </span>
                    )}
                    {s && s.makerCount > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        {s.makerCount}人が再現
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------- 投稿（主導線にしない） ---------- */}
      {methods.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            どれとも違うやり方をしていますか？
          </p>
          <Link
            href={`/post?combo=${themeComboSlug()}`}
            className="mt-1 inline-block text-sm brush-underline"
            style={{ fontWeight: 600 }}
          >
            自分の作り方を登録する
          </Link>
        </div>
      )}
    </div>
  )
}
