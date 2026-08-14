import Link from 'next/link'
import type { ComboSummary } from '@/lib/types/database'
import { comboHref } from '@/lib/combo'

export function ComboCard({ combo }: { combo: ComboSummary }) {
  const names = combo.flavorNames
  return (
    // 作り方が1件だけなら比較ページを挟まずミックス詳細へ直行（comboHref に規則を集約）
    <Link href={comboHref(combo)} className="card card-hover flex flex-col overflow-hidden fade-up">
      {combo.top.pack_photo_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={combo.top.pack_photo_url}
            alt={`${names.join(' × ')} の盛り方`}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        </>
      )}
      <div className="flex flex-1 flex-col p-5">
      {/* flavor combo line */}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg" style={{ fontWeight: 700 }}>
        {names.slice(0, 4).map((n, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: 'var(--color-ember)' }}>×</span>}
            <span>{n}</span>
          </span>
        ))}
        {names.length > 4 && (
          <span style={{ color: 'var(--color-ash-dim)', fontSize: '0.8rem' }}>+{names.length - 4}</span>
        )}
      </div>

      {combo.top.description && (
        <p
          className="text-sm"
          style={{
            color: 'var(--color-ash)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {combo.top.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {combo.topScore >= 60 && (
          <span
            className="chip"
            style={{ borderColor: 'var(--color-ember)', color: 'var(--color-ember-hot)', background: 'var(--accent-tint)' }}
          >
            📝 作り方くわしい
          </span>
        )}
        {combo.tags.map((t) => (
          <span key={t} className="chip">#{t}</span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span
          className="rounded-full px-2.5 py-1 text-xs"
          style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}
        >
          {combo.methodCount}通りの作り方
        </span>
        <span className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {combo.totalViews > 0 && <span>👁 {combo.totalViews}</span>}
          <span style={{ fontWeight: 600 }}>❤️ {combo.totalLikes}</span>
        </span>
      </div>
      </div>
    </Link>
  )
}
