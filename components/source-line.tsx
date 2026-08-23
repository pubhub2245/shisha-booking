import type { Source } from '@/lib/sources'

/** 説明文の出典を小さく表示する（外部リンク）。 */
export function SourceLine({
  sources,
  prefix = '参考',
  className = '',
}: {
  sources: Source[]
  prefix?: string
  className?: string
}) {
  if (!sources || sources.length === 0) return null
  return (
    <p className={`text-[0.62rem] leading-snug ${className}`} style={{ color: 'var(--color-ash-dim)' }}>
      {prefix}：
      {sources.map((s, i) => (
        <span key={s.id}>
          {i > 0 && '／'}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline underline-offset-2"
            style={{ color: 'var(--color-ash)' }}
          >
            {s.label}
          </a> </span>
      ))}
    </p>
  )
}
