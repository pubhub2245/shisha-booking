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
import { ScrubHero } from '@/components/scrub-hero'
import { Gauge } from '@/components/gauge'
import { Axes } from '@/components/axes'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '煙道 — 1つのフレーバーを、どう作るか',
  description:
    '同じフレーバーでも、ボウル・詰め方・HMD・炭・火入れで一台は変わります。実際に作られた作り方を試して、比べられます。',
}

const methodLabel = (m: { id: string; title: string | null }) => m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`

const STEPS = [
  { n: '壱', t: '他人の作り方を試す', d: 'いつもの一台を、誰かのやり方に置き換える' },
  { n: '弐', t: '作って、記録する', d: '作った・どうだった・味の印象を残す' },
  { n: '参', t: '前の一台と比べる', d: 'あなたの中で、どちらが良かったかを言う' },
]

/** ヒーローの資産。動画は差し替え可能な層で、無くてもページは完成している。
    ・形式を2つ持つのは、H.264 を積んでいないブラウザでスクラブを死なせないため
    ・切り出しを2つ持つのは、横長のコマをそのまま縦画面に敷くと主題が切れるため。
      縦画面には縦に切り出した軽い方（webm 約0.66MB）を配る */
const HERO = {
  wide: {
    sources: [
      { src: '/hero-scrub.mp4', type: 'video/mp4; codecs="avc1.42E01E"', bytes: 2177402 },
      { src: '/hero-scrub.webm', type: 'video/webm; codecs="vp9"', bytes: 1016051 },
    ],
    poster: '/hero-poster.webp',
  },
  tall: {
    sources: [
      { src: '/hero-scrub-p.mp4', type: 'video/mp4; codecs="avc1.42E01E"', bytes: 1276121 },
      { src: '/hero-scrub-p.webm', type: 'video/webm; codecs="vp9"', bytes: 673510 },
    ],
    poster: '/hero-poster-p.webp',
  },
  still: '/hero-still.webp',
}

/**
 * トップ＝「1つのフレーバーを、どう作るか」を体で分からせる場所。
 *
 * 初めて来た人には、スクロールで火が入っていく一連を見せる。下へ送る＝
 * トングが下りて炭が置かれる。動きとスクロールの向きを揃えている。
 * 既にログインしている人には旅をさせない。静止した一枚の下にすぐ本題を置く。
 * 見に来たのではなく、やりに来ているため。
 *
 * 並べ方の約束：隣り合うセクションで同じ骨格を使わない。
 */
export default async function Home() {
  const user = await getCurrentUser()

  const [flavors, themeOverview, themeMade, log] = await Promise.all([
    getFlavorsWithMethods(),
    getThemeOverview(FIRST_THEME.comboKey),
    user ? getMyThemeMade(FIRST_THEME.comboKey) : Promise.resolve([]),
    user ? getSmokeLog(10) : Promise.resolve({ entries: [], month: null }),
  ])

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
  const maxCount = Math.max(1, ...withMethods.map((f) => f.methodCount))

  return (
    <>
      {/* 部屋。ページ全体の後ろで、ひとつの環境として呼吸する */}
      <div className="room" aria-hidden />

      {user ? (
        <StillHero
          title="今日は、どれを作りますか。"
          lede="前に作った一台と、次の一台を、あなたの中で比べられます。"
        />
      ) : (
        <ScrubHero wide={HERO.wide} tall={HERO.tall} beats={BEATS}>
          <>
            <p className="eyebrow mb-4">王道シーシャ図鑑</p>
            <h1
              className="beat-h text-[clamp(1.9rem,4.6vw,3.4rem)] leading-[1.22]"
              style={{ fontWeight: 800, letterSpacing: '0.02em' }}
            >
              <span className="w" style={{ ['--th' as string]: 0, display: 'inline-block' }}>1つのフレーバーを、</span>
              <br />
              <span className="w" style={{ ['--th' as string]: 0.18, display: 'inline-block', color: 'var(--color-ember-hot)' }}>どう作るか。</span>
            </h1>
            <p className="lede mt-5 text-[0.95rem] leading-relaxed">
              煙道は、作り方を集める場所ではありません。同じ葉を、何通りで作れるかを見る場所です。
            </p>
          </>
          <>
            <p className="eyebrow mb-4">変えられるのは五つ</p>
            <h2 className="beat-h text-[clamp(1.4rem,3.2vw,2.35rem)] leading-[1.3]" style={{ fontWeight: 800 }}>
              <span className="w" style={{ ['--th' as string]: 0 }}>ボウル、詰め方、HMD、</span>
              <br />
              <span className="w" style={{ ['--th' as string]: 0.16 }}>炭、火入れ。</span>
            </h2>
            <p className="lede mt-5 text-[0.95rem] leading-relaxed">
              炭を一つ置く位置が違うだけで、同じ葉から別の一台が出ます。
              その違いは、感想ではなく手順で説明できます。
            </p>
          </>
          <>
            <p className="eyebrow mb-4">やることは一つ</p>
            <h2 className="beat-h text-[clamp(1.4rem,3.2vw,2.35rem)] leading-[1.3]" style={{ fontWeight: 800 }}>
              <span className="w" style={{ ['--th' as string]: 0 }}>他人の作り方を試して、</span>
              <br />
              <span className="w" style={{ ['--th' as string]: 0.16 }}>前の一台と比べる。</span>
            </h2>
            <div className="after mt-7 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="btn btn-ember text-sm">はじめる</Link>
              <Link href="/about" className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                煙道とは →
              </Link>
            </div>
          </>
        </ScrubHero>
      )}

      {/* ログアウト時は静止ヒーローも用意する。五つの門のどれかに当たった人はこちらを見る */}
      {!user && (
        <StillHero
          title="1つのフレーバーを、どう作るか。"
          lede="ボウル、詰め方、HMD、炭、火入れ。同じ葉から、これだけ違う一台ができます。"
          cta
        />
      )}

      {/* ---------- 何を比べているのか ── 等分に区切られた一列。ここだけの骨格 ---------- */}
      <section className="sect wrap pt-16 sm:pt-20">
        <div data-rise>
          <div className="gauge-rule" aria-hidden><i /><i /><i /><i /><i /></div>
          <h2 className="eyebrow">変えられるのは、この五つだけ</h2>
          <p className="sect-lede">
            葉は同じ。変わるのはここだけです。だから違いを感想ではなく手順で言えます。
          </p>
        </div>
        <Axes />
      </section>

      {/* ---------- 今月の煙道検証 ── 全幅の帯。左肩に火の縦罫 ---------- */}
      {themeFlavor && (
        <section className="sect band band-deep py-10 sm:py-14">
          <div className="wrap" data-rise>
            <Link
              href={themeNext ? `/method/${themeNext.method.id}` : `/flavor/${themeFlavor.flavor.id}`}
              className="band-rule block max-w-2xl"
            >
              <h2 className="eyebrow">今月の煙道検証</h2>
              {themeNext ? (
                <>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
                    あなたはこのフレーバーを {themeMade.length} 通りで作っています。次の一台はこれです。
                  </p>
                  <p className="mt-3 text-xl leading-tight" style={{ fontWeight: 800 }}>
                    {methodLabel(themeNext.method)}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-ember-text)', fontWeight: 700 }}>
                    {themeNext.diffs.map(describeDiff).join('／')}
                  </p>
                  <p className="mt-3 text-[0.72rem]" style={{ color: 'var(--color-ash-dim)' }}>
                    次にシーシャを作るときで大丈夫です。
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-2xl leading-tight" style={{ fontWeight: 800 }}>
                    {themeFlavor.flavor.brand} {themeFlavor.flavor.name}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-ember-text)', fontWeight: 700 }}>
                    {FIRST_THEME.lead}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
                    いつもの一台を、誰かのやり方に置き換えてみませんか。
                    {themeFlavor.methodCount > 0 && <> いま {themeFlavor.methodCount} 通りの作り方があります。</>}
                  </p>
                  <span className="mt-4 inline-block text-sm brush-underline" style={{ fontWeight: 600 }}>
                    見てみる →
                  </span>
                </>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* ---------- 直近の記録 ── 台帳の一行 ---------- */}
      {recent.length > 0 && (
        <section className="sect wrap">
          <div className="sect-head" data-rise>
            <h2 className="eyebrow">直近のあなたの一台</h2>
            <Link href="/mypage" className="text-xs" style={{ color: 'var(--color-ash)' }}>煙道帳 →</Link>
          </div>
          <div className="mt-3 flex flex-col" data-rise>
            {recent.map((e, i) => (
              <Link
                key={e.id ?? `${e.kind}-${i}`}
                href={`/method/${e.mix.id}`}
                className="baseline-row justify-between gap-3 border-b py-3"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="min-w-0 truncate text-sm" style={{ fontWeight: 600 }}>
                  {methodLabel(e.mix)}
                </span>
                <span className="label-mono shrink-0 text-xs" style={{ color: 'var(--color-ash)' }}>
                  {formatJaDate(e.at)} に{e.kind === 'made' ? '作った' : '吸った'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- 作り方があるフレーバー ── 横に流れる一列 ---------- */}
      <section className="sect wrap">
        <div data-rise>
          <div className="sect-head">
            <h2 className="eyebrow">いま擦られているフレーバー</h2>
            {withMethods.length > 0 && (
              <Link href="/flavors" className="text-xs" style={{ color: 'var(--color-ash)' }}>すべて →</Link>
            )}
          </div>
          <p className="sect-lede">目盛りの厚みが、そのフレーバーに集まっている作り方の数です。</p>
        </div>
        {withMethods.length === 0 ? (
          <div className="mt-5 border-t pt-8" style={{ borderColor: 'var(--line)' }} data-rise>
            <p className="claim">
              まだ<em>一台も</em>並んでいません。
            </p>
            <p className="mt-3 max-w-[30ch] text-sm" style={{ color: 'var(--color-ash)' }}>
              あなたのやり方が、最初の一台になります。
            </p>
            <Link href="/post" className="btn btn-ember mt-6 text-sm">作り方を登録する</Link>
          </div>
        ) : (
          <div className="mt-4 rail" tabIndex={0} role="region" aria-label="いま擦られているフレーバー">
            {withMethods.map(({ flavor, methodCount }) => (
              <Link
                key={flavor.id}
                href={`/flavor/${flavor.id}`}
                className="flex flex-col gap-1.5 rounded-lg border px-4 py-4"
                style={{ borderColor: 'var(--line-ui)' }}
              >
                <Gauge n={methodCount} max={maxCount} size="lg" />
                <span className="label-mono mt-1 text-[0.62rem]" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</span>
                <span className="truncate text-sm" style={{ fontWeight: 700 }}>{flavor.name}</span>
                <span className="baseline-row gap-1 text-xs" style={{ color: 'var(--color-ember-text)', fontWeight: 600 }}>
                  <span className="label-mono">{methodCount}</span><span>通りの作り方</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- まだ作り方がないフレーバー ── チップの塊 ---------- */}
      {rest.length > 0 && (
        <section className="sect wrap">
          <div data-rise>
            <h2 className="eyebrow">
              まだ作り方がないフレーバー（<span className="label-mono">{rest.length}</span>）
            </h2>
            <p className="sect-lede">あなたが最初の一台を残せます。</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5" data-rise>
            {rest.slice(0, 40).map(({ flavor }) => (
              <Link key={flavor.id} href={`/flavor/${flavor.id}`} className="chip">
                {flavor.name}
              </Link>
            ))}
          </div>
          {rest.length > 40 && (
            <Link href="/flavors" className="mt-4 inline-block text-sm brush-underline" style={{ fontWeight: 600 }}>
              すべてのフレーバーを見る（{flavors.length}）
            </Link>
          )}
        </section>
      )}

      {/* ---------- 煙道とは ── 縦に一本、火から立ちのぼる道 ---------- */}
      {!user && (
        <section className="sect band band-deep py-14 sm:py-20">
          <div className="wrap grid gap-10 md:grid-cols-2 md:gap-16">
            <div data-rise>
              <h2 className="eyebrow">煙道とは</h2>
              <p className="claim mt-4">
                一人の正解を集めるのではなく、<em>みんなの試行</em>から最適解を見つける。
              </p>
              <p className="mt-5 max-w-[34ch] text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                実際に作られ、吸われ、比べられた作り方だけが残ります。
                投稿の数ではなく、何度作られたかで決まります。
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <Link href="/signup" className="btn btn-ember text-sm">はじめる</Link>
                <Link href="/about" className="brush-underline text-sm" style={{ color: 'var(--color-ember-text)', fontWeight: 600 }}>
                  もっと読む →
                </Link>
              </div>
            </div>

            <ol className="path" data-rise>
              {STEPS.map((s) => (
                <li key={s.n} className="path-step">
                  <span className="path-n">{s.n}</span>
                  <span className="path-t">{s.t}</span>
                  <span className="path-d">{s.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  )
}

/** 動きを持たないヒーロー。飾りではなく、これ自体がひとつの版面 */
function StillHero({ title, lede, cta }: { title: string; lede: string; cta?: boolean }) {
  return (
    <section
      className="still"
      style={{ backgroundImage: `image-set(url("${HERO.still}") 1x)` }}
    >
      <div className="still-ember" aria-hidden />
      <div className="still-scrim" aria-hidden />
      <div className="beat-inner still-copy">
        <p className="eyebrow mb-4">王道シーシャ図鑑</p>
        {/* 語のまとまりごとに inline-block にして、単語の途中で折らせない */}
        <h1 className="text-[clamp(1.3rem,5.2vw,2.3rem)] leading-[1.34]" style={{ fontWeight: 800, maxWidth: '22ch' }}>
          {title.split('、').map((part, i, all) => (
            <span key={i} style={{ display: 'inline-block' }}>
              {part}{i < all.length - 1 ? '、' : ''}
            </span>
          ))}
        </h1>
        <p className="mt-4 max-w-[30ch] text-sm leading-relaxed">{lede}</p>
        {cta && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn btn-ember text-sm">はじめる</Link>
            <Link href="/about" className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              煙道とは →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/** 帯の割り当て。
   最初の帯だけ少し広い。開いた瞬間から出ている帯なので、
   読み切る前に次へ行かないよう余裕を持たせる（フリック試験で1回足りなかった）。 */
const BEATS = [
  { band: [0, 0.4] as [number, number], sx: '30%' },
  { band: [0.4, 0.71] as [number, number], sx: '30%' },
  { band: [0.71, 1] as [number, number], sx: '30%' },
]
