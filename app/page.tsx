import Link from 'next/link'
import { getMixes, getLikedMixIds, getTasteTags, getFlavors } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string; q?: string }>
}) {
  const sp = await searchParams
  const sort = sp.sort === 'popular' ? 'popular' : 'new'
  const tag = sp.tag
  const q = sp.q

  const [mixes, likedIds, tags, user, flavors] = await Promise.all([
    getMixes({ sort, tag, q }),
    getLikedMixIds(),
    getTasteTags(),
    getCurrentUser(),
    getFlavors(),
  ])
  const isAuthed = !!user
  const flavorShortcuts = flavors.slice(0, 12)

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { sort: sp.sort, tag, q, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const s = params.toString()
    return s ? `/?${s}` : '/'
  }

  return (
    <div className="wrap py-10 sm:py-14">
      {/* ---------- HERO ---------- */}
      <section className="fade-up mx-auto max-w-3xl text-center">
        <p className="eyebrow">Shisha Mix Encyclopedia</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl" style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          今日の一杯、<span className="ember-text">もう迷わない。</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'var(--color-ash)' }}>
          日本中の「美味しい」ミックスと、その作り方が集まる図鑑。
          気分から探して、そのまま材料も買える。あなたのレシピも投稿しよう。
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/post" className="btn btn-ember">＋ ミックスを投稿</Link>
          <Link href="/ranking" className="btn btn-ghost">人気ランキングを見る</Link>
        </div>
      </section>

      {/* ---------- SEARCH ---------- */}
      <form action="/" method="get" className="mx-auto mt-10 flex max-w-xl gap-2">
        {tag && <input type="hidden" name="tag" value={tag} />}
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="フレーバー名・気分・キーワードで検索"
          className="flex-1 rounded-full border px-5 py-3 text-sm outline-none"
          style={{ background: 'var(--color-smoke-900)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
        <button type="submit" className="btn btn-ghost">検索</button>
      </form>

      {/* ---------- FILTER BAR ---------- */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Link href={buildHref({ sort: undefined })} className={`chip ${sort === 'new' ? 'chip-active' : ''}`}>
              新着
            </Link>
            <Link href={buildHref({ sort: 'popular' })} className={`chip ${sort === 'popular' ? 'chip-active' : ''}`}>
              人気順
            </Link>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            {mixes.length} 件のミックス
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={buildHref({ tag: undefined })} className={`chip ${!tag ? 'chip-active' : ''}`}>
              すべて
            </Link>
            {tags.map((t) => (
              <Link key={t} href={buildHref({ tag: t })} className={`chip ${tag === t ? 'chip-active' : ''}`}>
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ---------- GRID ---------- */}
      {mixes.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mixes.map((mix) => (
            <MixCard key={mix.id} mix={mix} liked={likedIds.has(mix.id)} isAuthed={isAuthed} />
          ))}
        </div>
      ) : (
        <div className="card mt-8 p-12 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>まだミックスがありません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            {q || tag ? '条件を変えて探すか、' : ''}最初のミックスを投稿して図鑑を育てましょう。
          </p>
          <Link href="/post" className="btn btn-ember mt-5">＋ ミックスを投稿</Link>
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
