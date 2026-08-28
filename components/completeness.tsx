import type { MixWithRelations } from '@/lib/types/database'
import { mixCompleteness, completenessLevel } from '@/lib/quality'

/** 「作り方くわしい」バッジ。作り込み度が高い投稿を目立たせる。 */
export function CompletenessBadge({ mix }: { mix: MixWithRelations }) {
  const level = completenessLevel(mixCompleteness(mix))
  if (level === 'low') return null
  const high = level === 'high'
  return (
    <span
      className="chip"
      style={
        high
          ? { borderColor: 'var(--color-ember)', color: 'var(--color-ember-hot)', background: 'var(--accent-tint)' }
          : undefined
      }
    >
      {high ? '作り方くわしい' : '作り方あり'}
    </span>
  )
}
