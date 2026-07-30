import Link from 'next/link'
import { getCombos, getTasteTags, getFlavors } from '@/lib/queries'
import { ComboCard } from '@/components/combo-card'

export const dynamic = 'force-dynamic'

type Strength = 'light' | 'medium' | 'strong'
const STRENGTHS: { v: Strength; l: string }[] = [
  { v: 'light', l: '軽め' },
  { v: 'medium', l: 'ふつう' },
  { v: 'strong', l: '濃いめ' },
]
const STRENGTH_LABEL: Record<Strength, string> = { light: '軽め', medium: 'ふつう', strong: '濃いめ' }
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
  searchParams: Promise<{ sort?: string; tag?: string | string[]; strength?: string; q?: string }>
}) {
  const sp = await searchParams
  const sort = sp.sort === 'popular' ? 'popular' : 'new'
  const activeTags = toArray(sp.tag)
  const strength = (['light', 'medium', 'strong'] as const).includes(sp.strength as Strength)
    ? (sp.strength as Strength)
    : undefined
  const q = sp.q
  const hasFilters = activeTags.length > 0 || !!strength || !!q

  const [combos, allTags, flavors] = await Promise.all([
    getCombos({ sort, tags: activeTags, strength, q }),
    getTasteTags(),
    getFlavors(),
  ])
  const flavorShortcuts = flavors.slice(0, 12)

  // URL 構築（tag は複数 append）
  const href = (o: { tags?: string[]; strength?: Strength; sort?: string; q?: string }) => {
    const p = new URLSearchParams()
    const s = o.sort ?? (sort === 'popular' ? 'popular' : undefined)
    if (s) p.set('sort', s)
    if (o.q ?? q) p.set('q', (o.q ?? q) as string)
    const st = 'strength' in o ? o.strength : strength
    if (st) p.set('strength', st)
    for (const t of o.tags ?? activeTags) p.append('tag', t)
    const str = p.toString()
    return str ? `/?${str}` : '/'
  }
  const toggleTag = (t: string) =>
    href({ tags: activeTags.includes(t) ? activeTags.filter((x) => x !== t) : [...activeTags, t] })
  const toggleStrength = (v: Strength) => href({ strength: strength === v ? undefined : v })
  const otherTags = allTags.filter((t) => !MOOD_TASTE.includes(t) && !MOOD_TYPE.includes(t))

  return (
    <div className="wrap py-10 sm:py-14">
      {/* ---------- HERO ---------- */}
      <section className="fade-up mx-auto max-w-3xl text-center">
        <p className="eyebrow">Shisha Mix Encyclopedia</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl" style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          今日のミックス、<span className="ember-text">もう迷わない。</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'var(--color-ash)' }}>
          気分をタップするだけ。日本中の「美味しい」組み合わせと作り方が集まる図鑑から、
          いま吸いたい一台が見つかる。
        </p>
      </section>

      {/* ---------- 気分で探す ---------- */}
      <section className="card mx-auto mt-8 max-w-2xl p-5 sm:p-6">
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
          {sort === 'popular' && <input type="hidden" name="sort" value="popular" />}
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="フレーバー名・キーワードで検索"
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ background: '#fff', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
          />
          <button type="submit" className="btn btn-ghost text-sm">検索</button>
        </form>
      </section>

      {/* ---------- 結果バー ---------- */}
      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-between gap-3 sm:max-w-none">
        <div className="flex gap-2">
          <Link href={href({ sort: 'new' })} className={`chip ${sort === 'new' ? 'chip-active' : ''}`}>新着</Link>
          <Link href={href({ sort: 'popular' })} className={`chip ${sort === 'popular' ? 'chip-active' : ''}`}>人気順</Link>
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
          <p className="text-lg" style={{ fontWeight: 700 }}>この気分のミックスはまだありません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            {hasFilters ? '条件をゆるめるか、' : ''}この組み合わせの作り方を、あなたが最初に投稿しませんか？
          </p>
          <div className="mt-5 flex justify-center gap-3">
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
        </section>
      )}

      {/* ---------- TEASERS ---------- */}
      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <Link href="/for-shops" className="card card-hover flex flex-col justify-between gap-3 p-6">
          <div>
            <div className="text-xl" aria-hidden>🏠</div>
            <h3 className="mt-2 text-base" style={{ fontWeight: 700 }}>店舗の方へ</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              お店のミックスで指名集客。無料で店舗登録できます。
            </p>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
        </Link>
        <Link href="/about" className="card card-hover flex flex-col justify-between gap-3 p-6">
          <div>
            <div className="text-xl" aria-hidden>📖</div>
            <h3 className="mt-2 text-base" style={{ fontWeight: 700 }}>MixHubとは</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              日本のシーシャの「美味しい」を、みんなで育てる図鑑。
            </p>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>詳しく見る →</span>
        </Link>
      </section>
    </div>
  )
}
