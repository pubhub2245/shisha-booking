import Link from 'next/link'
import { getCombos, getTasteTags, getFlavors, getRecentPhotoMixes, getOnboardingStatus, getRecommendedMixes, getLikedMixIds, getMakeableReps } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { ComboCard } from '@/components/combo-card'
import { MixCard } from '@/components/mix-card'
import { IconOrb } from '@/components/icon-orb'
import { Kamon } from '@/components/kamon'
import { OnboardingCard } from '@/components/onboarding-card'
import { ModeChooser } from '@/components/mode-chooser'
import { needsModeChoice, resolveMode } from '@/lib/mode'
import { flavorLine } from '@/lib/mix'

export const dynamic = 'force-dynamic'

type Sort = 'new' | 'popular' | 'detailed'
// 気分（キュレーション）
const MOOD_TASTE = ['甘い', 'スッキリ', '濃厚', 'さっぱり', '爽快']
const MOOD_TYPE = ['フルーツ', 'ミント', 'ベリー', 'デザート', 'トロピカル', 'お茶', '和']

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string | string[]; q?: string; makeable?: string; page?: string }>
}) {
  const sp = await searchParams
  const sort: Sort = sp.sort === 'popular' ? 'popular' : sp.sort === 'detailed' ? 'detailed' : 'new'
  const PER_PAGE = 24
  const page = Math.max(1, Number(sp.page) || 1)
  const activeTags = toArray(sp.tag)
  const q = sp.q
  const user = await getCurrentUser()
  const makeableOnly = !!user && sp.makeable === '1'
  const hasFilters = activeTags.length > 0 || !!q || makeableOnly
  const onboarding = user ? await getOnboardingStatus() : { hasShelf: false, hasPosted: false }
  const hasProfile = !!(user?.profile?.username && user?.profile?.display_name)
  const [recommended, recLikedIds] =
    user && !hasFilters ? await Promise.all([getRecommendedMixes(6), getLikedMixIds()]) : [[], new Set<string>()]
  // 棚（マイフレーバー）×王道＝「今作れる王道 / あと1種で作れる王道」（再訪動機＋購入導線）
  const makeableReps =
    user && !hasFilters && onboarding.hasShelf ? await getMakeableReps() : { ready: [], almost: [] }

  const [combos, allTags, flavors, photoMixes, unfilteredCombos] = await Promise.all([
    getCombos({ sort, tags: activeTags, q, makeableOnly }),
    getTasteTags(),
    getFlavors(),
    hasFilters ? Promise.resolve([]) : getRecentPhotoMixes(12),
    // ヒーローの総数は「サイト全体の組み合わせ数」で固定する（絞り込みで動かさない）。
    // 絞り込み時だけ別途取得（並列なのでウォーターフォールにしない）。
    hasFilters ? getCombos({}) : Promise.resolve(null),
  ])
  // 総数＝サイト全体（固定）／件数フィードバックは操作地点＝フィルタUIの近くに出す
  const totalCombos = unfilteredCombos ? unfilteredCombos.length : combos.length
  const flavorShortcuts = flavors.slice(0, 12)
  const topBrands = [...new Set(flavors.map((f) => f.brand))].sort((a, b) => a.localeCompare(b, 'ja')).slice(0, 12)

  // URL 構築（tag は複数 append）
  const href = (o: { tags?: string[]; sort?: Sort; q?: string; makeable?: boolean; page?: number }) => {
    const p = new URLSearchParams()
    const s = o.sort ?? sort
    if (s && s !== 'new') p.set('sort', s)
    if (o.q ?? q) p.set('q', (o.q ?? q) as string)
    for (const t of o.tags ?? activeTags) p.append('tag', t)
    if ('makeable' in o ? o.makeable : makeableOnly) p.set('makeable', '1')
    if (o.page && o.page > 1) p.set('page', String(o.page))
    const str = p.toString()
    return str ? `/?${str}` : '/'
  }
  const toggleTag = (t: string) =>
    href({ tags: activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t] })
  const otherTags = allTags.filter((t) => !MOOD_TASTE.includes(t) && !MOOD_TYPE.includes(t))
  // 系統・タグのいずれかが選択中なら「もっと絞り込む」を開いた状態にする
  const advancedActive = activeTags.some((t) => !MOOD_TASTE.includes(t))
  const mode = resolveMode(user?.profile)

  return (
    <div className="wrap py-8 sm:py-12">
      {/* ---------- HERO（コンパクト） ---------- */}
      <section className="glow-bg fade-up mx-auto max-w-2xl text-center">
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <span className="float d1"><IconOrb preset="green" size={30}><Kamon name="hanabishi" size={17} /></IconOrb></span>
          <span className="float d2"><IconOrb preset="amber" size={30}><Kamon name="sakura" size={17} /></IconOrb></span>
          <span className="float d3"><IconOrb preset="blue" size={30}><Kamon name="seigaiha" size={17} /></IconOrb></span>
          <span className="float d4"><IconOrb preset="violet" size={30}><Kamon name="shippou" size={17} /></IconOrb></span>
          <span className="float d5"><IconOrb preset="green" size={30}><Kamon name="igeta" size={17} /></IconOrb></span>
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          今日のミックス、<span className="text-grad-anim">もう迷わない。</span>
        </h1>
        {/* ミッション（共創性）→ ベネフィットの根拠、の順で3〜5秒で伝える */}
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-cream)', fontWeight: 600 }}>
          日本のシーシャの「王道」を、みんなでつくる。
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          実際に作られ、吸われ、<b className="bouten">支持された作り方</b>から、まず試したい一台が見つかります。
        </p>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {flavors.length > 0
            ? `${totalCombos}通りの組み合わせ ・ ${flavors.length}種のフレーバー`
            : '気分で探す ・ 作り方で選ぶ王道シーシャ図鑑'}
        </p>
        {/* 煙（けむり）＝ブランド"煙道"の象徴を一筋 */}
        <div className="smoke-line mx-auto mt-3 w-6" aria-hidden />
        {/* モード連動のショートカット */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {mode === 'pro' ? (
            <>
              <Link href="/post" className="chip chip-active">🛠 フル投稿</Link>
              <Link href="/national" className="chip">王道</Link>
              <Link href="/areas" className="chip">📍 地域別・近くの名店</Link>
              <Link href="/timeline" className="chip">🕒 タイムライン</Link>
              <Link href="/shop/new" className="chip">🏠 店舗を登録</Link>
            </>
          ) : (
            <>
              <Link href="/national" className="chip chip-active">王道</Link>
              <Link href="/areas" className="chip">📍 近くの名店</Link>
              <Link href="/shelf" className="chip">🫙 あと1つで作れる</Link>
              <Link href="/guide" className="chip">📖 作り方ガイド</Link>
            </>
          )}
        </div>
        {user && mode === 'simple' && (
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            シンプル表示中。上部の <b style={{ color: 'var(--color-ash)' }}>詳細</b> で、熱管理・ランキング・タイムラインなどが最初から見られます。
          </p>
        )}
      </section>

      {/* ---------- 王道とは（3秒で伝わる"仕組み"）───ただの検索でなく"決める場所"だと示す ---------- */}
      <section className="mx-auto mt-8 max-w-2xl">
        <div className="card card-wa p-5 sm:p-6">
          <div className="flex items-center justify-center gap-2.5">
            <span className="seal seal-stamp text-xs">王道</span>
            <p className="text-sm sm:text-base" style={{ fontWeight: 700 }}>
              その組み合わせで<span className="bouten">最も支持された作り方</span>が「王道」。
            </p>
          </div>
          <div className="kaisen mt-4" aria-hidden><span className="seal-dot" /></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { n: '壱', t: '作り方を持ち寄る', d: '配分・熱管理・盛り方' },
              { n: '弐', t: '実際に吸って評価', d: 'いいね・作った・実地評価' },
              { n: '参', t: '王道が決まる', d: '日本の"美味しい"の基準' },
            ].map((s) => (
              <div key={s.n}>
                <div className="rank-kanji text-lg">{s.n}</div>
                <div className="mt-1 text-xs sm:text-sm" style={{ fontWeight: 700 }}>{s.t}</div>
                <div className="mt-0.5 text-[0.68rem] leading-snug" style={{ color: 'var(--color-ash-dim)' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href="/national" className="btn btn-ember text-sm" style={{ padding: '9px 18px' }}>王道を見る</Link>
            <Link href="/about" className="brush-underline text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>煙道とは →</Link>
          </div>
        </div>
      </section>

      {/* ---------- モード選択（初回・未設定ユーザー向け） ---------- */}
      {user && needsModeChoice(user.profile) && <ModeChooser />}

      {/* ---------- オンボーディング（初回ユーザー向け） ---------- */}
      {user && (
        <OnboardingCard hasProfile={hasProfile} hasShelf={onboarding.hasShelf} hasPosted={onboarding.hasPosted} mode={mode} />
      )}

      {/* ---------- 棚×王道：あなたが今作れる王道（再訪動機＋購入導線） ---------- */}
      {user && (makeableReps.ready.length > 0 || makeableReps.almost.length > 0) && (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>
              <span className="seal seal-stamp mr-2 text-xs">王道</span>
              あなたが<span className="ember-text">今作れる王道</span>
              {makeableReps.ready.length > 0 && (
                <span className="ml-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>{makeableReps.ready.length}件</span>
              )}
            </h2>
            <Link href="/shelf" className="brush-underline text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              マイフレーバーを編集 →
            </Link>
          </div>
          {makeableReps.ready.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {makeableReps.ready.map((rep) => (
                <MixCard key={rep.mix.id} mix={rep.mix} liked={recLikedIds.has(rep.mix.id)} isAuthed={!!user} />
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              棚のフレーバーだけで作れる王道はまだありません。<b>あと1種</b>で作れる王道はこちら↓
            </p>
          )}
          {makeableReps.almost.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>
                あと1種で作れる王道 <span style={{ color: 'var(--color-ash-dim)' }}>{makeableReps.almost.length}件</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {makeableReps.almost.map(({ rep, missing }) => (
                  <Link
                    key={rep.mix.id}
                    href={missing.flavorId ? `/flavor/${missing.flavorId}` : `/mix/${rep.mix.id}`}
                    className="chip"
                    title={`不足：${missing.name}（タップで入手）`}
                  >
                    {flavorLine(rep.mix.mix_flavors)}
                    <span style={{ color: 'var(--color-seal)', fontWeight: 700 }}>＋{missing.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------- 気分で探す（デフォルトは味わい＋検索、詳細は折りたたみ） ---------- */}
      <section id="mood" className="card mx-auto mt-6 max-w-2xl p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm" style={{ fontWeight: 700 }}>気分で探す</h2>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>複数選べます</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MOOD_TASTE.map((t) => (
            <Link key={t} href={toggleTag(t)} className={`chip ${activeTags.includes(t) ? 'chip-active' : ''}`}>{t}</Link>
          ))}
        </div>

        {/* もっと絞り込む（系統・タグ）＝プロモードのみ。かんたんモードは味わいだけでシンプルに */}
        {mode === 'pro' && (
        <details className="mt-3" open={advancedActive}>
          <summary
            className="cursor-pointer list-none text-xs [&::-webkit-details-marker]:hidden"
            style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
          >
            もっと絞り込む（系統・タグ）
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>系統</span>
              {MOOD_TYPE.map((t) => (
                <Link key={t} href={toggleTag(t)} className={`chip ${activeTags.includes(t) ? 'chip-active' : ''}`}>{t}</Link>
              ))}
            </div>
            {otherTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>タグ</span>
                {otherTags.slice(0, 12).map((t) => (
                  <Link key={t} href={toggleTag(t)} className={`chip ${activeTags.includes(t) ? 'chip-active' : ''}`}>#{t}</Link>
                ))}
              </div>
            )}
          </div>
        </details>
        )}

        {/* キーワード検索 */}
        <form action="/" method="get" className="mt-4 flex gap-2">
          {activeTags.map((t) => <input key={t} type="hidden" name="tag" value={t} />)}
          {sort !== 'new' && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="フレーバー名・キーワードで検索"
            className="min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
          />
          <button type="submit" className="btn btn-ghost shrink-0 text-sm">検索</button>
        </form>
      </section>

      {/* ---------- 結果バー ---------- */}
      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-between gap-3 sm:max-w-none">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ sort: 'new' })} className={`chip ${sort === 'new' ? 'chip-active' : ''}`}>新着</Link>
          <Link href={href({ sort: 'popular' })} className={`chip ${sort === 'popular' ? 'chip-active' : ''}`}>人気順</Link>
          {mode === 'pro' && (
            <Link href={href({ sort: 'detailed' })} className={`chip ${sort === 'detailed' ? 'chip-active' : ''}`}>詳しい順</Link>
          )}
          {user && (
            <Link href={href({ makeable: !makeableOnly })} className={`chip ${makeableOnly ? 'chip-active' : ''}`}>
              🫙 棚で作れる
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <Link href="/" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>条件をクリア</Link>
          )}
          {/* 操作地点（フィルタUI）の直近に結果件数を出す。絞り込み中は強調する */}
          <span
            className="text-xs"
            aria-live="polite"
            style={{
              color: hasFilters ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)',
              fontWeight: hasFilters ? 700 : 400,
            }}
          >
            {hasFilters ? `${combos.length}件 見つかりました` : `${combos.length}件の組み合わせ`}
          </span>
        </div>
      </div>

      {/* 選択中の条件 */}
      {hasFilters && (
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap gap-1.5 sm:max-w-none">
          {activeTags.map((t) => (
            <Link key={t} href={toggleTag(t)} className="chip chip-active">{t} ✕</Link>
          ))}
          {makeableOnly && (
            <Link href={href({ makeable: false })} className="chip chip-active">🫙 棚で作れる ✕</Link>
          )}
          {q && <span className="chip">「{q}」</span>}
        </div>
      )}

      {/* ---------- GRID (Combo単位) ---------- */}
      {combos.length > 0 ? (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {combos.slice(0, page * PER_PAGE).map((combo) => (
              <ComboCard key={combo.key} combo={combo} />
            ))}
          </div>
          {combos.length > page * PER_PAGE && (
            <div className="mt-8 flex justify-center">
              <Link href={href({ page: page + 1 })} className="btn btn-ghost" scroll={false}>
                もっと見る（残り{combos.length - page * PER_PAGE}件）
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="card mt-6 p-12 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>
            {makeableOnly ? '棚のフレーバーで作れるミックスがありません' : 'この気分のミックスはまだありません'}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            {makeableOnly
              ? 'マイフレーバーに持っているものを追加すると、作れるミックスが増えます。'
              : `${hasFilters ? '条件をゆるめるか、' : ''}この組み合わせの作り方を、あなたが最初に投稿しませんか？`}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {makeableOnly && <Link href="/shelf" className="btn btn-ghost">🫙 マイフレーバーを編集</Link>}
            {hasFilters && <Link href="/" className="btn btn-ghost">条件をクリア</Link>}
            <Link href="/post" className="btn btn-ember">＋ ミックスを投稿</Link>
          </div>
        </div>
      )}

      {/* ---------- あなたへのおすすめ ---------- */}
      {recommended.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>✨ あなたへのおすすめ</h2>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>いいねの傾向から</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((m) => (
              <MixCard key={m.id} mix={m} liked={recLikedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- PHOTO STRIP（みんなの盛り方） ---------- */}
      {photoMixes.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>📷 みんなの盛り方</h2>
            <Link href="/search" className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>もっと見る →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photoMixes.map((m) => (
              <Link key={m.id} href={`/mix/${m.id}`} className="group block shrink-0" style={{ width: 150 }}>
                <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.pack_photo_url!}
                    alt={`${flavorLine(m.mix_flavors)} の盛り方`}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="mt-1 truncate text-xs" style={{ color: 'var(--color-ash)' }}>{flavorLine(m.mix_flavors)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- FLAVOR SHORTCUTS ---------- */}
      {flavorShortcuts.length > 0 && (
        <section className="mt-16">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg" style={{ fontWeight: 700 }}>フレーバーから探す</h2>
            <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              すべて見る →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {flavorShortcuts.map((f) => (
              <Link key={f.id} href={`/flavor/${f.id}`} className="chip">
                {f.name}
              </Link>
            ))}
          </div>

          {topBrands.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>ブランドから探す</h3>
              <div className="flex flex-wrap gap-2">
                {topBrands.map((b) => (
                  <Link key={b} href={`/brand/${encodeURIComponent(b)}`} className="chip">
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------- 使い方 3ステップ（未ログインの初見向け。常連には出さない） ---------- */}
      {!user && (
      <section className="mt-16">
        <div className="mb-5 text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="noren-heading mt-2 text-2xl" style={{ fontWeight: 800 }}>三段で、迷わず一台</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { preset: 'green' as const, icon: '探', n: 1, kanji: '序', t: '気分で探す', d: '甘い・スッキリ・系統から、いま吸いたい組み合わせを見つける。' },
            { preset: 'amber' as const, icon: '熱', n: 2, kanji: '破', t: '作り方を極める', d: '熱管理カーブや炭のセットアップまで、詳しい作り方が見られる。' },
            { preset: 'violet' as const, icon: '購', n: 3, kanji: '急', t: '買って・投稿する', d: '材料をそのまま購入。自分の一台も図鑑に投稿しよう。' },
          ].map((s) => (
            <div key={s.n} className="card card-wa flex flex-col items-center gap-3 p-6 text-center">
              <span className={`float d${s.n}`}><IconOrb preset={s.preset} size={60}><span className="font-display" style={{ fontWeight: 700 }}>{s.icon}</span></IconOrb></span>
              <div className="flex items-center gap-1.5">
                <span className="rank-kanji text-lg">{s.kanji}</span>
                <span className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 700, letterSpacing: '0.16em' }}>其ノ{['一', '二', '三'][s.n - 1]}</span>
              </div>
              <h3 className="text-base" style={{ fontWeight: 700 }}>{s.t}</h3>
              <p className="text-sm" style={{ color: 'var(--color-ash)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ---------- TEASERS（未ログインの初見向け） ---------- */}
      {!user && (
      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        <Link href="/for-shops" className="card card-hover flex items-center gap-4 p-6">
          <IconOrb preset="amber" size={52}><span className="font-display" style={{ fontWeight: 700 }}>店</span></IconOrb>
          <div>
            <h3 className="text-base" style={{ fontWeight: 700 }}>店舗の方へ</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              お店のミックスで指名集客。無料で店舗登録できます。
            </p>
            <span className="mt-1 inline-block text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
          </div>
        </Link>
        <Link href="/about" className="card card-hover flex items-center gap-4 p-6">
          <IconOrb preset="green" size={52}><span className="font-display" style={{ fontWeight: 700 }}>図</span></IconOrb>
          <div>
            <h3 className="text-base" style={{ fontWeight: 700 }}>煙道とは</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              日本のシーシャの「美味しい」を、みんなで育てる図鑑。
            </p>
            <span className="mt-1 inline-block text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
          </div>
        </Link>
      </section>
      )}
    </div>
  )
}
