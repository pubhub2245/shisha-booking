import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMixById, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { LikeButton } from '@/components/like-button'
import { StrengthMeter } from '@/components/strength-meter'
import { withAffiliateTag } from '@/lib/affiliate'
import type { MixWithRelations } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function authorLabel(mix: MixWithRelations): string {
  if (!mix.author) return 'MixHub 編集部'
  if (mix.author.is_shop && mix.author.shop_name) return mix.author.shop_name
  return mix.author.display_name || (mix.author.username ? `@${mix.author.username}` : '名無し')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const mix = await getMixById(id)
  if (!mix) return { title: 'ミックスが見つかりません — MixHub' }
  return {
    title: `${mix.title} — MixHub`,
    description: mix.description ?? 'シーシャのミックスレシピ',
  }
}

export default async function MixDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [mix, likedIds, user] = await Promise.all([getMixById(id), getLikedMixIds(), getCurrentUser()])
  if (!mix) notFound()

  const flavors = mix.mix_flavors ?? []

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        ← 図鑑にもどる
      </Link>

      {/* ---------- HEADER ---------- */}
      <header className="mt-5 fade-up">
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xl" style={{ fontWeight: 700 }}>
          {flavors.map((f, i) => (
            <span key={f.id} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: 'var(--color-ember)' }}>×</span>}
              <span>{f.name}</span>
            </span>
          ))}
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
          {mix.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <LikeButton
            mixId={mix.id}
            initialCount={mix.like_count}
            initialLiked={likedIds.has(mix.id)}
            isAuthed={!!user}
            size="lg"
          />
          <StrengthMeter strength={mix.strength} />
          <span className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            by {authorLabel(mix)}
          </span>
        </div>

        {mix.taste_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mix.taste_tags.map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="chip">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </header>

      {mix.description && (
        <p className="mt-6 text-[0.98rem] leading-relaxed" style={{ color: 'var(--color-cream)' }}>
          {mix.description}
        </p>
      )}

      {/* ---------- FLAVORS + AFFILIATE ---------- */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm eyebrow">Flavors — 使用フレーバー</h2>
        <div className="card divide-y" style={{ borderColor: 'var(--line)' }}>
          {flavors.map((f) => (
            <div key={f.id} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span style={{ fontWeight: 700 }}>{f.name}</span>
                  {f.ratio != null && (
                    <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                      {f.ratio}%
                    </span>
                  )}
                </div>
                {f.brand && (
                  <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    {f.brand}
                  </div>
                )}
                {f.placement && (
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
                    置き方: {f.placement}
                  </div>
                )}
              </div>
              {withAffiliateTag(f.affiliate_url) && (
                <a
                  href={withAffiliateTag(f.affiliate_url)!}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn btn-ghost text-sm"
                >
                  購入する
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 購入リンクにはアフィリエイトを含む場合があります。
        </p>
      </section>

      {/* ---------- BREW NOTES ---------- */}
      {(mix.heat_management || mix.placement_note) && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm eyebrow">How to make — 作り方ノート</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mix.heat_management && (
              <div className="card p-5">
                <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>🔥 熱帯・炭の管理</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                  {mix.heat_management}
                </p>
              </div>
            )}
            {mix.placement_note && (
              <div className="card p-5">
                <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>🍃 フレーバーの置き方</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                  {mix.placement_note}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-12 flex justify-center">
        <Link href="/post" className="btn btn-ember">あなたのミックスも投稿する</Link>
      </div>
    </div>
  )
}
