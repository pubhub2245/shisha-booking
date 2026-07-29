import type { Strength } from '@/lib/types/database'

const LABEL: Record<Strength, string> = { light: '軽め', medium: 'ふつう', strong: '濃いめ' }
const LEVEL: Record<Strength, number> = { light: 1, medium: 2, strong: 3 }

export function StrengthMeter({ strength }: { strength: Strength | null }) {
  if (!strength) return null
  const level = LEVEL[strength]
  return (
    <span className="inline-flex items-center gap-1.5" title={`濃さ: ${LABEL[strength]}`}>
      <span className="flex items-center gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`dot ${i <= level ? 'dot-on' : ''}`} />
        ))}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-ash)' }}>{LABEL[strength]}</span>
    </span>
  )
}
