import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getFlavorById,
  getFlavorHub,
  getMyThemeMade,
  getShopsWithFlavor,
  getMyShelfFlavorIds,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { ShelfButton } from '@/components/shelf-button'
import { DesignSpaceMap } from '@/components/design-space-map'
import { HeatCurveChart, type CurveSeries } from '@/components/heat-curve-chart'
import { CURVE_COLORS, bowlLabel, packLabel, hmsLabel, charcoalAmountLabel } from '@/lib/heat'
import { buildDesignSpace, diffMethods, describeDiff, rankNextCandidates } from '@/lib/method-diff'
import { goHref } from '@/lib/go'

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
  const [myMade, user, shelfIds, shops] = await Promise.all([
    getMyThemeMade(key),
    getCurrentUser(),
    getMyShelfFlavorIds(),
    getShopsWithFlavor(flavor),
  ])

  const madeIds = new Set(myMade.map((r) => r.mixId))
  const myLatest = myMade[0] ? methods.find((m) => m.id === myMade[0].mixId) ?? null : null
  const space = buildDesignSpace(methods, myLatest)
  const next = myLatest
    ? rankNextCandidates(myLatest, methods, {
        madeIds,
        makerCount: (mid) => stats.get(mid)?.makerCount ?? 0,
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

        <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          作り方 {methods.length}
          {progress.participants > 0 && <> ・ 作った人 {progress.participants}</>}
          {progress.multiMethod > 0 && <> ・ 2つ以上作った人 {progress.multiMethod}</>}
        </p>
      </header>

      {/* ---------- 主導線 ---------- */}
      {methods.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            このフレーバーの作り方は、まだ1つもありません。
            <br />
            あなたのやり方が、最初の一台になります。
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
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                あなたはこのフレーバーを {myMade.length} 通りで作っています。
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
                        href={`/method/${c.method.id}`}
                        className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                        style={{ borderColor: 'var(--color-ember)' }}
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
                  いまある作り方は一通り試しました。あなたのやり方も登録できます。
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
