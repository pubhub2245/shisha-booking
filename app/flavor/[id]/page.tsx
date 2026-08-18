import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getFlavorById,
  getFlavorHub,
  getMyThemeMade,
  getMyThemeComparisons,
  getShopsWithFlavor,
  getMyShelfFlavorIds,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { ShelfButton } from '@/components/shelf-button'
import { DesignSpaceMap } from '@/components/design-space-map'
import { HeatCurveChart, type CurveSeries } from '@/components/heat-curve-chart'
import { CURVE_COLORS, bowlLabel, packLabel, hmsLabel, charcoalAmountLabel } from '@/lib/heat'
import {
  buildDesignSpace,
  diffMethods,
  describeDiff,
  rankNextCandidates,
  compareMethods,
  explainExperiment,
  nextExperimentPolicy,
} from '@/lib/method-diff'
import { goHref } from '@/lib/go'
import { FIRST_THEME, isThemeCombo } from '@/lib/theme'

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
    title: `${flavor.brand} ${flavor.name} の作り方 — 煙道`,
    description: `${flavor.brand} ${flavor.name} を、どう作るか。実際に作られた作り方を比べられます。`,
  }
}

const label = (m: { id: string; title: string | null }) => m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`

/** その作り方の要点。並べて比べられるように、常に同じ5項目・同じ順で出す。 */
function MethodLine({ m }: { m: Parameters<typeof diffMethods>[0] }) {
  const parts = [
    bowlLabel(m.bowl_type),
    packLabel(m.pack_style),
    hmsLabel(m.hms_type),
    charcoalAmountLabel(m.charcoal_size_mm, m.charcoal_count) ? `炭 ${charcoalAmountLabel(m.charcoal_size_mm, m.charcoal_count)}` : null,
    m.steep_minutes != null ? `蒸らし${m.steep_minutes}分` : null,
  ].filter(Boolean)
  if (parts.length === 0) return null
  return (
    <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
      {parts.join(' ／ ')}
    </span>
  )
}

/**
 * フレーバーのページ＝煙道の中心。
 *
 * 「このフレーバーを使ったミックス一覧」ではなく、「このフレーバーを、どう作るか」を扱う。
 * 作り方は必ずこのフレーバー1つに対するもので、配合という概念は持たない。
 */
export default async function FlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hub = await getFlavorHub(id)
  if (!hub) notFound()

  const { flavor, key, methods, stats, progress, orthodoxMixId } = hub
  const [myMade, myComparisons, user, shelfIds, shops] = await Promise.all([
    getMyThemeMade(key),
    getMyThemeComparisons(key),
    getCurrentUser(),
    getMyShelfFlavorIds(),
    getShopsWithFlavor(flavor),
  ])

  const madeIds = new Set(myMade.map((r) => r.mixId))
  const myLatest = myMade[0] ? methods.find((m) => m.id === myMade[0].mixId) ?? null : null
  const space = buildDesignSpace(methods, myLatest)
  const makerCount = (mid: string) => stats.get(mid)?.makerCount ?? 0

  /**
   * 直近の比較から、次の実験を決める。
   *
   * 比較の結果は記録した直後の画面にしか出ていなかったので、数日後に戻ってきたときには
   * 「何が分かったか」が消えていた。フレーバーのページはこのフレーバーの実験ノートなので、
   * ここに前回の結論と次の一手を置く（比較はゴールではなく、次の実験の材料）。
   */
  const lastCmp = myComparisons[0] ?? null
  const lastSubject = lastCmp ? methods.find((m) => m.id === lastCmp.mixId) ?? null : null
  const lastObject = lastCmp ? methods.find((m) => m.id === lastCmp.comparedToMixId) ?? null : null
  const lastPolicy =
    lastCmp && lastSubject && lastObject
      ? nextExperimentPolicy(
          lastCmp.comparison === 'same' ? 'same' : 'better',
          diffMethods(lastObject, lastSubject)
        )
      : null

  // 次の1台：比較まで進んでいれば、その結論を反映した候補を出す
  const base = lastPolicy ? lastSubject! : myLatest
  const next = base
    ? rankNextCandidates(base, methods, {
        madeIds,
        makerCount,
        preferAxes: lastPolicy?.preferAxes,
        avoidAxes: lastPolicy?.avoidAxes,
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

  const postHref = `/post?flavor=${flavor.id}`
  const isTheme = isThemeCombo(key)

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← フレーバー一覧</Link>

      {/* ---------- HEADER ---------- */}
      <header className="mt-4 fade-up">
        <p className="eyebrow">{flavor.brand}</p>
        <h1 className="mt-1 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
          {flavor.name}
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
          この一台の、最適解を探す。
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          フレーバーは変えません。変わるのは、ボウル・詰め方・HMD・炭・火入れだけ。
          同じ葉から、どれだけ違う一台ができるのか。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ShelfButton flavorId={flavor.id} initialOwned={shelfIds.has(flavor.id)} isAuthed={!!user} />
          {goHref(flavor.affiliate_url, { f: flavor.id }) && (
            <a
              href={goHref(flavor.affiliate_url, { f: flavor.id })!}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="text-sm"
              style={{ color: 'var(--color-ash-dim)' }}
            >
              購入する
            </a>
          )}
        </div>

        {/* 実験の現在地。検索結果ではなく実験ページなので、0でもそのまま出す（0は正常な出発点） */}
        <dl className="mt-5 grid grid-cols-4 gap-2">
          {[
            { k: '作り方', v: methods.length },
            { k: '作られた', v: progress.madeTotal },
            { k: '試した人', v: progress.participants },
            { k: '比較', v: progress.comparisons },
          ].map((s) => (
            <div key={s.k} className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--accent-tint)' }}>
              <dt className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>{s.k}</dt>
              <dd className="text-lg" style={{ fontWeight: 800 }}>{s.v}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ---------- 今月の検証テーマなら、何を検証しているのかを先に置く ---------- */}
      {isTheme && (
        <section className="card card-wa mt-6 p-5">
          <p className="eyebrow">今月の煙道検証</p>
          <ul className="mt-2 flex flex-col gap-1">
            {FIRST_THEME.why.map((w) => (
              <li key={w} className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                {w}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            確かめたいのは「一番おいしい作り方」ではなく、
            <span style={{ color: 'var(--color-cream)', fontWeight: 700 }}>作り方を変えると何が変わるのか</span>
            です。
          </p>
        </section>
      )}

      {/* ---------- 主導線 ---------- */}
      {methods.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            このフレーバーの作り方は、まだ1つもありません。
            <br />
            あなたのやり方が、最初の一台になります。
            {isTheme && (
              <>
                <br />
                <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                  比べるには2通り以上が要ります。まずは、いつも作っている作り方をそのまま残してください。
                </span>
              </>
            )}
          </p>
          <Link href={postHref} className="btn btn-ember">作り方を登録する</Link>
        </div>
      ) : (
        <section className="card mt-6 p-5">
          {myMade.length === 0 ? (
            <>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>まず、あなたの基準になる一台を。</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                いきなり登録は要りません。<strong>いつもの一台を、誰かのやり方に置き換えてみる</strong>だけです。
                自分のやり方に近いものを1つ選んで、普段どおり作ってみてください。
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {methods.slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    href={`/method/${m.id}`}
                    className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <span className="text-sm" style={{ fontWeight: 700 }}>
                      {label(m)}
                      {orthodoxMixId === m.id && <span className="seal seal-stamp ml-2 text-[0.6rem]">王道</span>}
                    </span>
                    <MethodLine m={m} />
                    <span className="mt-1 text-xs brush-underline" style={{ fontWeight: 700 }}>
                      この作り方を試す →
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                あなたはこのフレーバーを {myMade.length} 通りで作っています。
              </h2>

              {/* 前回の比較で分かったこと。比較を「その場かぎりの入力」で終わらせない */}
              {lastPolicy && lastSubject && lastObject && (
                <div className="mt-3 rounded-lg p-3" style={{ background: 'var(--accent-tint)' }}>
                  <p className="text-[0.7rem]" style={{ color: 'var(--color-ash-dim)' }}>
                    前回の比較（{label(lastSubject)} と {label(lastObject)}）で分かったこと
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-cream)' }}>
                    <span style={{ fontWeight: 700 }}>{lastPolicy.finding}</span>
                    {lastPolicy.suggestion}
                  </p>
                </div>
              )}

              {next.length > 0 ? (
                <>
                  <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
                    {lastPolicy ? 'その次の一台にするなら、これです。' : '次に試すと違いが分かりやすいのは、この作り方です。'}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {next.slice(0, 2).map((c) => {
                      const learn = base ? explainExperiment(compareMethods(base, c.method)) : null
                      return (
                        <Link
                          key={c.method.id}
                          href={`/method/${c.method.id}`}
                          className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                          style={{ borderColor: 'var(--color-ember)' }}
                        >
                          <span className="text-sm" style={{ fontWeight: 700 }}>{label(c.method)}</span>
                          <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                            {c.diffs.map(describeDiff).join('／')}
                          </span>
                          {learn && (
                            <span className="text-[0.7rem] leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
                              {learn}
                            </span>
                          )}
                          <span className="mt-1 text-xs brush-underline" style={{ fontWeight: 700 }}>
                            この作り方を試す →
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-[0.7rem]" style={{ color: 'var(--color-ash-dim)' }}>
                    次にシーシャを作るときで大丈夫です。
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                    いまある作り方は一通り試しました。
                    {lastPolicy
                      ? '分かったことを踏まえて、1つだけ変えた作り方を自分で残せます。'
                      : 'ここから1つだけ変えた作り方を残すと、その差を比べられます。'}
                  </p>
                  {/* 次の一台が他人の作り方から出てこないときは、自分で作るしかない。
                      ここを行き止まりにすると、作り方が1〜2件の時期にループが止まる */}
                  <Link
                    href={base ? `/post?from=${base.id}` : postHref}
                    className="btn btn-ember mt-3 inline-block"
                  >
                    1つだけ変えた作り方を残す
                  </Link>
                </>
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

      {/* ---------- 作り方一覧 ---------- */}
      {methods.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">作り方（{methods.length}）</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            人気順ではありません。まだ誰も試していない作り方にも、同じだけ意味があります。
          </p>
          <div className="flex flex-col gap-2">
            {methods.map((m) => {
              const s = stats.get(m.id)
              const diffs = myLatest && myLatest.id !== m.id ? diffMethods(myLatest, m) : []
              return (
                <Link
                  key={m.id}
                  href={`/method/${m.id}`}
                  className="flex flex-col gap-1 rounded-lg border px-3 py-3"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span className="text-sm" style={{ fontWeight: 700 }}>
                    {label(m)}
                    {orthodoxMixId === m.id && <span className="seal seal-stamp ml-2 text-[0.6rem]">王道</span>}
                    {madeIds.has(m.id) && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                        作った
                      </span>
                    )}
                  </span>
                  <MethodLine m={m} />
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {diffs.length > 0 && diffs.length <= 2 && (
                      <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                        あなたの一台と {diffs.map((d) => d.label).join('・')} が違います
                      </span>
                    )}
                    {s && s.makerCount > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        {s.makerCount}人が再現
                      </span>
                    )}
                    {/* 何回試されたかより、何回「別の作り方と比べられたか」。
                        どちらが勝ったかは出さない（勝敗表にすると王道が人気投票になる） */}
                    {s && s.compared > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        比較 {s.compared}回
                        {s.sameCount > 0 && <>（うち差が出なかった {s.sameCount}）</>}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------- この店で吸える ---------- */}
      {shops.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm eyebrow">このフレーバーを置いている店</h2>
          <div className="flex flex-wrap gap-2">
            {shops.slice(0, 8).map((s) => (
              <Link key={s.id} href={`/shop/${s.id}`} className="chip">{s.name}</Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- 登録（主導線にしない） ---------- */}
      {methods.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>どれとも違うやり方をしていますか？</p>
          <Link href={postHref} className="mt-1 inline-block text-sm brush-underline" style={{ fontWeight: 600 }}>
            自分の作り方を登録する
          </Link>
        </div>
      )}
    </div>
  )
}
