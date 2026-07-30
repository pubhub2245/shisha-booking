import Link from 'next/link'
import type { MixWithRelations } from '@/lib/types/database'
import { LikeButton } from '@/components/like-button'
import { StrengthMeter } from '@/components/strength-meter'

function authorLabel(mix: MixWithRelations): string {
  if (!mix.author) return 'MixHub 編集部'
  if (mix.author.is_shop && mix.author.shop_name) return mix.author.shop_name
  return mix.author.display_name || (mix.author.username ? `@${mix.author.username}` : '名無し')
}

export function MixCard({
  mix,
  liked,
  isAuthed,
}: {
  mix: MixWithRelations
  liked: boolean
  isAuthed: boolean
}) {
  const flavors = mix.mix_flavors ?? []
  return (
    <article className="card card-hover flex flex-col fade-up">
      <Link href={`/mix/${mix.id}`} className="flex flex-1 flex-col p-5">
        {/* flavor combo line */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {flavors.slice(0, 4).map((f, i) => (
            <span key={f.id} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: 'var(--color-ember)' }}>×</span>}
              <span style={{ fontWeight: 600 }}>{f.name}</span>
            </span>
          ))}
          {flavors.length > 4 && (
            <span style={{ color: 'var(--color-ash-dim)', fontSize: '0.8rem' }}>+{flavors.length - 4}</span>
          )}
        </div>

        <h3 className="text-lg leading-snug" style={{ fontWeight: 700 }}>
          {mix.title}
        </h3>

        {mix.description && (
          <p
            className="mt-2 text-sm"
            style={{
              color: 'var(--color-ash)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {mix.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {mix.author_id === null && (
            <span
              className="chip"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash-dim)', background: 'transparent' }}
            >
              サンプル
            </span>
          )}
          {mix.taste_tags.slice(0, 3).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            {authorLabel(mix)}
          </span>
          <StrengthMeter strength={mix.strength} />
        </div>
      </Link>

      <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: 'var(--line)' }}>
        <LikeButton mixId={mix.id} initialCount={mix.like_count} initialLiked={liked} isAuthed={isAuthed} />
        <Link href={`/mix/${mix.id}`} className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          作り方を見る →
        </Link>
      </div>
    </article>
  )
}
