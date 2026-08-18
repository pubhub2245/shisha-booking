import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getFlavorsWithMethods,
  getThemeOverview,
  getMyThemeMade,
  getSmokeLog,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { flavorKey } from '@/lib/combo'
import { FIRST_THEME } from '@/lib/theme'
import { rankNextCandidates, describeDiff } from '@/lib/method-diff'
import { formatJaDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '煙道 — 1つのフレーバーを、どう作るか',
  description:
    '同じフレーバーでも、ボウル・詰め方・HMD・炭・火入れで一台は変わります。実際に作られた作り方を試して、比べられます。',
}

const methodLabel = (m: { id: string; title: string | null }) => m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`

/**
 * トップ＝フレーバーを選ぶ場所。
 *
 * 煙道が扱うのは「1つのフレーバーを、どう作るか」。フレーバーの組み合わせ（ミックス）は
 * 概念として持たないので、トップに並ぶのも組み合わせではなくフレーバーそのもの。
 */
export default async function Home() {
  const user = await getCurrentUser()

  const [flavors, themeOverview, themeMade, log] = await Promise.all([
    getFlavorsWithMethods(),
    getThemeOverview(FIRST_THEME.comboKey),
    user ? getMyThemeMade(FIRST_THEME.comboKey) : Promise.resolve([]),
    user ? getSmokeLog(10) : Promise.resolve({ entries: [], month: null }),
  ])

  // 今月の煙道検証のフレーバー（テーマは combo ではなくフレーバー1つを指す）
  const themeFlavor = flavors.find((f) => flavorKey(f.flavor.brand, f.flavor.name) === FIRST_THEME.comboKey)

  const madeIds = new Set(themeMade.map((r) => r.mixId))
  const themeLatest = themeMade[0] ? themeOverview.methods.find((m) => m.id === themeMade[0].mixId) ?? null : null
  const themeNext = themeLatest
    ? rankNextCandidates(themeLatest, themeOverview.methods, {
        madeIds,
        makerCount: (id) => themeOverview.stats.get(id)?.makerCount ?? 0,
      }).find((c) => !madeIds.has(c.method.id))
    : undefined

  const withMethods = flavors.filter((f) => f.methodCount > 0)
  const rest = flavors.filter((f) => f.methodCount === 0)
  const recent = log.entries.slice(0, 3)

  return (
    <div className="wrap max-w-3xl py-8 sm:py-12">
      {/* ---------- HERO ---------- */}
      <section className="fade-up text-center">
        <h1 className="text-2xl leading-tight sm:text-3xl" style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          1つのフレーバーを、<span className="text-grad-anim">どう作るか。</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          ボウル・詰め方・HMD・炭・火入れ。
          同じ葉から、どれだけ違う一台ができるのか。実際に作られた作り方を、試して比べられます。
        </p>
      </section>

      {/* ---------- 今月の煙道検証 ---------- */}
      {themeFlavor && (
        <section className="mt-8">
          <Link
            href={themeNext ? `/method/${themeNext.method.id}` : `/flavor/${themeFlavor.flavor.id}`}
            className="card block p-5 sm:p-6"
          >
            <p className="eyebrow">今月の煙道検証</p>
            {themeNext ? (
              <>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--color-ash)' }}>
                  あなたはこのフレーバーを {themeMade.length} 通りで作っています。次の一台はこれです。
                </p>
                <p className="mt-2 text-lg leading-tight" style={{ fontWeight: 800 }}>
                  {methodLabel(themeNext.method)}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                  {themeNext.diffs.map(describeDiff).join('／')}
                </p>
                <p className="mt-2 text-[0.7rem]" style={{ color: 'var(--color-ash-dim)' }}>
                  次にシーシャを作るときで大丈夫です。
                </p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-xl leading-tight" style={{ fontWeight: 800 }}>
                  {themeFlavor.flavor.brand} {themeFlavor.flavor.name}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                  {FIRST_THEME.lead}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
                  いつもの一台を、誰かのやり方に置き換えてみませんか。
                  {themeFlavor.methodCount > 0 && <> いま {themeFlavor.methodCount} 通りの作り方があります。</>}
                </p>
                <span className="mt-3 inline-block text-sm brush-underline" style={{ fontWeight: 600 }}>
                  見てみる →
                </span>
              </>
            )}
          </Link>
        </section>
      )}

      {/* ---------- 直近の記録 ---------- */}
      {recent.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm eyebrow">直近のあなたの一台</h2>
            <Link href="/mypage" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>煙道帳 →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((e, i) => (
              <Link
                key={e.id ?? `${e.kind}-${i}`}
                href={`/method/${e.mix.id}`}
                className="flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2.5"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="min-w-0 truncate text-sm" style={{ fontWeight: 600 }}>
                  {methodLabel(e.mix)}
                </span>
                <span className="shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                  {formatJaDate(e.at)} に{e.kind === 'made' ? '作った' : '吸った'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- 作り方があるフレーバー ---------- */}
      <section className="mt-12">
        <h2 className="mb-1 text-sm eyebrow">いま擦られているフレーバー</h2>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          作り方が集まっているフレーバーほど、比べられることが増えます。
        </p>
        {withMethods.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              まだ作り方が1つもありません。
              <br />
              あなたのやり方が、最初の一台になります。
            </p>
            <Link href="/post" className="btn btn-ember mt-4">作り方を登録する</Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {withMethods.map(({ flavor, methodCount }) => (
              <Link
                key={flavor.id}
                href={`/flavor/${flavor.id}`}
                className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</span>
                <span className="truncate text-sm" style={{ fontWeight: 700 }}>{flavor.name}</span>
                <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                  {methodCount} 通りの作り方
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- まだ作り方がないフレーバー ---------- */}
      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">まだ作り方がないフレーバー（{rest.length}）</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            あなたが最初の一台を残せます。
          </p>
          <div className="flex flex-wrap gap-1.5">
            {rest.slice(0, 40).map(({ flavor }) => (
              <Link key={flavor.id} href={`/flavor/${flavor.id}`} className="chip">
                {flavor.name}
              </Link>
            ))}
          </div>
          {rest.length > 40 && (
            <Link href="/flavors" className="mt-3 inline-block text-sm brush-underline" style={{ fontWeight: 600 }}>
              すべてのフレーバーを見る（{flavors.length}）
            </Link>
          )}
        </section>
      )}

      {/* ---------- 煙道とは（初見向け） ---------- */}
      {!user && (
        <section className="card card-wa mt-14 p-5 sm:p-6">
          <div className="flex items-center justify-center gap-2.5">
            <span className="seal seal-stamp text-xs">王道</span>
            <p className="text-sm sm:text-base" style={{ fontWeight: 700 }}>
              実際に作られ、吸われ、比べられた作り方から、<span className="bouten">「まずこれ」</span>を見つける。
            </p>
          </div>
          <div className="kaisen mt-4" aria-hidden><span className="seal-dot" /></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { n: '壱', t: '他人の作り方を試す', d: 'いつもの一台を置き換える' },
              { n: '弐', t: '作って、記録する', d: '作った・どうだった・味の印象' },
              { n: '参', t: '前の一台と比べる', d: 'あなたの中で、どちらが良かったか' },
            ].map((s) => (
              <div key={s.n}>
                <div className="rank-kanji text-lg">{s.n}</div>
                <div className="mt-1 text-xs sm:text-sm" style={{ fontWeight: 700 }}>{s.t}</div>
                <div className="mt-0.5 text-[0.68rem] leading-snug" style={{ color: 'var(--color-ash-dim)' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href="/signup" className="btn btn-ember text-sm" style={{ padding: '9px 18px' }}>はじめる</Link>
            <Link href="/about" className="brush-underline text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>煙道とは →</Link>
          </div>
        </section>
      )}
    </div>
  )
}
