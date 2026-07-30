import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getMixById,
  getLikedMixIds,
  getBookmarkedMixIds,
  getMixComments,
  getRelatedMixes,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { LikeButton } from '@/components/like-button'
import { BookmarkButton } from '@/components/bookmark-button'
import { ShareButton } from '@/components/share-button'
import { StrengthMeter } from '@/components/strength-meter'
import { CommentForm } from '@/components/comment-form'
import { ViewTracker } from '@/components/view-tracker'
import { MixCard } from '@/components/mix-card'
import { deleteMix } from '@/actions/mixes'
import { deleteComment } from '@/actions/social'
import { withAffiliateTag } from '@/lib/affiliate'
import type { MixWithRelations, MixAuthor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function authorName(author: MixAuthor | null): string {
  if (!author) return 'MixHub 編集部'
  if (author.is_shop && author.shop_name) return author.shop_name
  return author.display_name || (author.username ? `@${author.username}` : '名無し')
}

function AuthorLink({ author }: { author: MixAuthor | null }) {
  const name = authorName(author)
  if (author?.username) {
    return (
      <Link href={`/u/${author.username}`} className="hover:underline" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
        {name}
      </Link>
    )
  }
  return <span style={{ color: 'var(--color-ash-dim)' }}>{name}</span>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const mix = await getMixById(id)
  if (!mix) return { title: 'ミックスが見つかりません — MixHub' }
  const flavorLine = (mix.mix_flavors ?? []).map((f) => f.name).join(' × ')
  return {
    title: `${mix.title} — MixHub`,
    description: mix.description ?? flavorLine ?? 'シーシャのミックスレシピ',
    openGraph: { title: mix.title, description: mix.description ?? flavorLine },
  }
}

export default async function MixDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [mix, likedIds, bookmarkedIds, user, comments] = await Promise.all([
    getMixById(id),
    getLikedMixIds(),
    getBookmarkedMixIds(),
    getCurrentUser(),
    getMixComments(id),
  ])
  if (!mix) notFound()
  const related = await getRelatedMixes(mix as MixWithRelations)

  const flavors = mix.mix_flavors ?? []
  const isOwner = !!user && user.id === mix.author_id
  const isSample = mix.author_id === null

  return (
    <div className="wrap max-w-3xl py-10">
      <ViewTracker mixId={mix.id} />
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          ← 図鑑にもどる
        </Link>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/mix/${mix.id}/edit`} className="btn btn-ghost text-sm">編集</Link>
            <form action={deleteMix}>
              <input type="hidden" name="mix_id" value={mix.id} />
              <button type="submit" className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>
                削除
              </button>
            </form>
          </div>
        )}
      </div>

      {isSample && (
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--accent-tint)', color: 'var(--color-ash)' }}
        >
          🧪 これは <b>MixHub 編集部のサンプル</b>です。作り方は一般的な目安で、専門家の監修はされていません。
          実際の「美味しい作り方」は、これから皆さんの投稿で育てていきます。
        </div>
      )}

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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LikeButton
            mixId={mix.id}
            initialCount={mix.like_count}
            initialLiked={likedIds.has(mix.id)}
            isAuthed={!!user}
            size="lg"
          />
          <BookmarkButton mixId={mix.id} initialSaved={bookmarkedIds.has(mix.id)} isAuthed={!!user} />
          <ShareButton title={mix.title} />
          <StrengthMeter strength={mix.strength} />
        </div>
        <div className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
          by <AuthorLink author={mix.author} /> ・ 👁 {mix.view_count}
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

      {/* ---------- COMMENTS ---------- */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm eyebrow">Comments — コメント（{comments.length}）</h2>
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ fontWeight: 600 }}>
                  <AuthorLink author={c.author} />
                </div>
                {user?.id === c.user_id && (
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="mix_id" value={mix.id} />
                    <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                      削除
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>
                {c.body}
              </p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
              まだコメントはありません。最初のコメントを書きましょう。
            </p>
          )}
        </div>
        <div className="mt-4">
          <CommentForm mixId={mix.id} isAuthed={!!user} />
        </div>
      </section>

      {/* ---------- RELATED ---------- */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm eyebrow">Related — 似た系統のミックス</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 flex justify-center">
        <Link href="/post" className="btn btn-ember">あなたのミックスも投稿する</Link>
      </div>
    </div>
  )
}
