import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getComboBySlug, getLikedMixIds, getMyUnlockedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { HeatCurveChart, type CurveSeries } from '@/components/heat-curve-chart'
import { CURVE_COLORS } from '@/lib/heat'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const combo = await getComboBySlug(slug)
  if (!combo) return { title: '組み合わせが見つかりません — MixHub' }
  const line = combo.flavorNames.join(' × ')
  return {
    title: `${line} のミックス（${combo.methods.length}通りの作り方）— MixHub`,
    description: `${line} の作り方を比較。人気の作り方から自分に合った作り方を見つけよう。`,
  }
}

export default async function ComboPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [combo, likedIds, user, unlockedIds] = await Promise.all([
    getComboBySlug(slug),
    getLikedMixIds(),
    getCurrentUser(),
    getMyUnlockedMixIds(),
  ])
  if (!combo) notFound()

  const [top, ...rest] = combo.methods
  const totalLikes = combo.methods.reduce((s, m) => s + m.like_count, 0)

  // 有料ノートで熱カーブがロックされている作り方は、権利のない閲覧者には比較に含めない（漏洩防止）
  const canSeeCurve = (m: (typeof combo.methods)[number]) => {
    const locked = m.premium && (m.locked_sections ?? []).includes('heat_curve')
    if (!locked) return true
    return m.author_id === user?.id || !!user?.profile?.is_admin || unlockedIds.has(m.id)
  }

  // 熱カーブ比較（2件以上に曲線があるとき）
  const curveSeries: CurveSeries[] = combo.methods
    .filter((m) => canSeeCurve(m) && Array.isArray(m.heat_curve) && m.heat_curve.length >= 2)
    .slice(0, 6)
    .map((m, i) => ({
      label: m.title.length > 16 ? m.title.slice(0, 16) + '…' : m.title,
      color: CURVE_COLORS[i % CURVE_COLORS.length],
      points: m.heat_curve!,
    }))

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← 図鑑にもどる</Link>

      {/* ---------- HEADER ---------- */}
      <header className="mt-4 fade-up">
        <p className="eyebrow">Combo — 組み合わせ</p>
        <h1 className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
          {combo.flavorNames.map((n, i) => (
            <span key={i} className="flex items-center gap-2.5">
              {i > 0 && <span style={{ color: 'var(--color-ember)' }}>×</span>}
              <span>{n}</span>
            </span>
          ))}
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
          {combo.methods.length}通りの作り方 ・ 合計 ❤️ {totalLikes}
        </p>
      </header>

      {/* ---------- 定番 ---------- */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm eyebrow">定番の作り方</h2>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>いちばん詳しく作り込まれた作り方</span>
        </div>
        <MixCard mix={top} liked={likedIds.has(top.id)} isAuthed={!!user} />
      </section>

      {/* ---------- 熱カーブ比較 ---------- */}
      {curveSeries.length >= 2 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">Heat comparison — 熱カーブ比較</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            同じ組み合わせでも、作り手ごとに熱の入れ方が違います。重ねて見比べてみましょう。
          </p>
          <div className="card p-5">
            <HeatCurveChart series={curveSeries} />
          </div>
        </section>
      )}

      {/* ---------- バリエーション ---------- */}
      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm eyebrow">他の作り方（{rest.length}）</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>詳しく書かれた作り方から順に表示しています</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- 自分の作り方を追加 ---------- */}
      <div className="card mt-12 flex flex-col items-center gap-3 p-8 text-center">
        <h2 className="text-lg" style={{ fontWeight: 700 }}>あなたの作り方は、これと何が違う？</h2>
        <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
          同じ組み合わせでも、熱の入れ方や置き方で味は変わります。あなたの作り方を追加しましょう。
        </p>
        <Link href={`/post?combo=${slug}`} className="btn btn-ember">
          この組み合わせで作り方を投稿
        </Link>
      </div>
    </div>
  )
}
