import Link from 'next/link'
import { getCombos, getTasteTags, getFlavors } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { ComboCard } from '@/components/combo-card'
import { IconOrb } from '@/components/icon-orb'
import { OnboardingHint } from '@/components/onboarding-hint'

export const dynamic = 'force-dynamic'

type Strength = 'light' | 'medium' | 'strong'
const STRENGTHS: { v: Strength; l: string }[] = [
  { v: 'light', l: '軽め' },
  { v: 'medium', l: 'ふつう' },
  { v: 'strong', l: '濃いめ' },
]
const STRENGTH_LABEL: Record<Strength, string> = { light: '軽め', medium: 'ふつう', strong: '濃いめ' }
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
  searchParams: Promise<{ sort?: string; tag?: string | string[]; strength?: string; q?: string; makeable?: string }>
}) {
  const sp = await searchParams
  const sort: Sort = sp.sort === 'popular' ? 'popular' : sp.sort === 'detailed' ? 'detailed' : 'new'
  const activeTags = toArray(sp.tag)
  const strength = (['light', 'medium', 'strong'] as const).includes(sp.strength as Strength)
    ? (sp.strength as Strength)
    : undefined
  const q = sp.q
  const user = await getCurrentUser()
  const makeableOnly = !!user && sp.makeable === '1'
  const hasFilters = activeTags.length > 0 || !!strength || !!q || makeableOnly

  const [combos, allTags, flavors] = await Promise.all([
    getCombos({ sort, tags: activeTags, strength, q, makeableOnly }),
    getTasteTags(),
    getFlavors(),
  ])
  const flavorShortcuts = flavors.slice(0, 12)
  const topBrands = [...new Set(flavors.map((f) => f.brand))].sort((a, b) => a.localeCompare(b, 'ja')).slice(0, 12)

  // URL 構築（tag は複数 append）
  const href = (o: { tags?: string[]; strength?: Strength; sort?: Sort; q?: string; makeable?: boolean }) => {
    const p = new URLSearchParams()
    const s = o.sort ?? sort
    if (s && s !== 'new') p.set('sort', s)
    if (o.q ?? q) p.set('q', (o.q ?? q) as string)
    const st = 'strength' in o ? o.strength : strength
    if (st) p.set('strength', st)
    for (const t of o.tags ?? activeTags) p.append('tag', t)
    if ('makeable' in o ? o.makeable : makeableOnly) p.set('makeable', '1')
    const str = p.toString()
    return str ? `/?${str}` : '/'
  }
  const toggleTag = (t: string) =>
    href({ tags: activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t] })
  const toggleStrength = (v: Strength) => href({ strength: strength === v ? undefined : v })
  const otherTags = allTags.filter((t) => !MOOD_TASTE.includes(t) && !MOOD_TYPE.includes(t))

  return (
    <div className="wrap py-10 sm:py-14">
      <OnboardingHint isAuthed={!!user} />
      {/* ---------- HERO ---------- */}
      <section className="glow-bg fade-up mx-auto max-w-3xl text-center">
        {/* 浮遊するフレーバーオーブ（遊び心） */}
        <div className="mb-5 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          <span className="float d1"><IconOrb preset="green" size={40}>🍏</IconOrb></span>
          <span className="float d2"><IconOrb preset="amber" size={40}>🍊</IconOrb></span>
          <span className="float d3"><IconOrb preset="blue" size={40}>🫐</IconOrb></span>
          <span className="float d4"><IconOrb preset="violet" size={40}>🍇</IconOrb></span>
          <span className="float d5"><IconOrb preset="green" size={40}>🍃</IconOrb></span>
        </div>
        <p className="eyebrow">Shisha Mix Encyclopedia</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl" style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          今日のミックス、<span className="text-grad-anim">もう迷わない。</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'var(--color-ash)' }}>
          気分をタップするだけ。日本中の「美味しい」組み合わせと作り方が集まる図鑑から、
          いま吸いたい一台が見つかる。
        </p>
        <p className="mt-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {combos.length} 通りの組み合わせ ・ {flavors.length} 種のフレーバー
        </p>
      </section>

      {/* ---------- 気分で探す ---------- */}
      <section id="mood" className="card mx-auto mt-8 max-w-2xl p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm" style={{ fontWeight: 700 }}>気分で探す</h2>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>複数選べます</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>味わい</span>
            {MOOD_TASTE.map((t) => (
              <Link key={t} href={toggleTag(t)} className={`chip ${activeTags.includes(t) ? 'chip-active' : ''}`}>{t}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>系統</span>
            {MOOD_TYPE.map((t) => (
              <Link key={t} href={toggleTag(t)} className={`chip ${activeTags.includes(t) ? 'chip-active' : ''}`}>{t}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>強さ</span>
            {STRENGTHS.map((s) => (
              <Link key={s.v} href={toggleStrength(s.v)} className={`chip ${strength === s.v ? 'chip-active' : ''}`}>{s.l}</Link>
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

        {/* キーワード検索 */}
        <form action="/" method="get" className="mt-4 flex gap-2">
          {activeTags.map((t) => <input key={t} type="hidden" name="tag" value={t} />)}
          {strength && <input type="hidden" name="strength" value={strength} />}
          {sort !== 'new' && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="フレーバー名・キーワードで検索"
            className="min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ background: '#fff', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
          />
          <button type="submit" className="btn btn-ghost shrink-0 text-sm">検索</button>
        </form>
      </section>

      {/* ---------- 結果バー ---------- */}
      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-between gap-3 sm:max-w-none">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ sort: 'new' })} className={`chip ${sort === 'new' ? 'chip-active' : ''}`}>新着</Link>
          <Link href={href({ sort: 'popular' })} className={`chip ${sort === 'popular' ? 'chip-active' : ''}`}>人気順</Link>
          <Link href={href({ sort: 'detailed' })} className={`chip ${sort === 'detailed' ? 'chip-active' : ''}`}>詳しい順</Link>
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
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{combos.length} 件</span>
        </div>
      </div>

      {/* 選択中の条件 */}
      {hasFilters && (
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap gap-1.5 sm:max-w-none">
          {activeTags.map((t) => (
            <Link key={t} href={toggleTag(t)} className="chip chip-active">{t} ✕</Link>
          ))}
          {strength && (
            <Link href={toggleStrength(strength)} className="chip chip-active">{STRENGTH_LABEL[strength]} ✕</Link>
          )}
          {makeableOnly && (
            <Link href={href({ makeable: false })} className="chip chip-active">🫙 棚で作れる ✕</Link>
          )}
          {q && <span className="chip">「{q}」</span>}
        </div>
      )}

      {/* ---------- GRID (Combo単位) ---------- */}
      {combos.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.key} combo={combo} />
          ))}
        </div>
      ) : (
        <div className="card mt-6 p-12 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>
            {makeableOnly ? '棚のフレーバーで作れるミックスがありません' : 'この気分のミックスはまだありません'}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            {makeableOnly
              ? 'マイ棚に持っているフレーバーを追加すると、作れるミックスが増えます。'
              : `${hasFilters ? '条件をゆるめるか、' : ''}この組み合わせの作り方を、あなたが最初に投稿しませんか？`}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {makeableOnly && <Link href="/shelf" className="btn btn-ghost">🫙 マイ棚を編集</Link>}
            {hasFilters && <Link href="/" className="btn btn-ghost">条件をクリア</Link>}
            <Link href="/post" className="btn btn-ember">＋ ミックスを投稿</Link>
          </div>
        </div>
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

      {/* ---------- 使い方 3ステップ ---------- */}
      <section className="mt-16">
        <div className="mb-5 text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-2xl" style={{ fontWeight: 800 }}>3ステップで、迷わず一台</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { preset: 'green' as const, icon: '🔍', n: 1, t: '気分で探す', d: '甘い・スッキリ・強さから、いま吸いたい組み合わせを見つける。' },
            { preset: 'amber' as const, icon: '🔥', n: 2, t: '作り方を極める', d: '熱管理カーブや炭のセットアップまで、詳しい作り方が見られる。' },
            { preset: 'violet' as const, icon: '🛒', n: 3, t: '買って・投稿する', d: '材料をそのまま購入。自分の一台も図鑑に投稿しよう。' },
          ].map((s) => (
            <div key={s.n} className="card flex flex-col items-center gap-3 p-6 text-center">
              <span className={`float d${s.n}`}><IconOrb preset={s.preset} size={60}>{s.icon}</IconOrb></span>
              <div className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700, letterSpacing: '0.1em' }}>STEP {s.n}</div>
              <h3 className="text-base" style={{ fontWeight: 700 }}>{s.t}</h3>
              <p className="text-sm" style={{ color: 'var(--color-ash)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- TEASERS ---------- */}
      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        <Link href="/for-shops" className="card card-hover flex items-center gap-4 p-6">
          <IconOrb preset="amber" size={52}>🏠</IconOrb>
          <div>
            <h3 className="text-base" style={{ fontWeight: 700 }}>店舗の方へ</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              お店のミックスで指名集客。無料で店舗登録できます。
            </p>
            <span className="mt-1 inline-block text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
          </div>
        </Link>
        <Link href="/about" className="card card-hover flex items-center gap-4 p-6">
          <IconOrb preset="green" size={52}>📖</IconOrb>
          <div>
            <h3 className="text-base" style={{ fontWeight: 700 }}>MixHubとは</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              日本のシーシャの「美味しい」を、みんなで育てる図鑑。
            </p>
            <span className="mt-1 inline-block text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
          </div>
        </Link>
      </section>
    </div>
  )
}
