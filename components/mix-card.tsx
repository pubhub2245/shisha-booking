import Link from 'next/link'
import type { MixWithRelations } from '@/lib/types/database'
import { flavorLine } from '@/lib/mix'
import { LikeButton } from '@/components/like-button'
import { VerifiedBadge } from '@/components/verified-badge'
import { CompletenessBadge } from '@/components/completeness'

function authorLabel(mix: MixWithRelations): string {
  if (!mix.author) return '煙道 編集部'
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
    <article className="card card-hover flex flex-col overflow-hidden fade-up">
      <Link href={`/method/${mix.id}`} className="flex flex-1 flex-col">
        {mix.pack_photo_url && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mix.pack_photo_url}
              alt={`${flavorLine(flavors)} の盛り方`}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
        {/* フレーバー名＝正式名（主役） */}
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg leading-snug" style={{ fontWeight: 700 }}>
          {flavors.slice(0, 4).map((f, i) => (
            <span key={f.id} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: 'var(--color-ember)', fontWeight: 400 }}>×</span>}
              <span>{f.name}</span>
            </span>
          ))}
          {flavors.length > 4 && (
            <span style={{ color: 'var(--color-ash-dim)', fontSize: '0.8rem' }}>+{flavors.length - 4}</span>
          )}
        </h3>

        {/* 任意の一言（特徴） */}
        {mix.title && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}>{mix.title}</p>
        )}

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
          <CompletenessBadge mix={mix} />
          {mix.taste_tags.slice(0, 2).map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            {authorLabel(mix)}
            {mix.author?.is_pro && <VerifiedBadge size={13} />}
          </span>
        </div>
        </div>
      </Link>

      <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: 'var(--line)' }}>
        <LikeButton mixId={mix.id} initialCount={mix.like_count} initialLiked={liked} isAuthed={isAuthed} />
        <Link href={`/method/${mix.id}`} className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          作り方を見る →
        </Link>
      </div>
    </article>
  )
}
