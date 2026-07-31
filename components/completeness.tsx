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
      {high ? '📝 作り方くわしい' : '作り方あり'}
    </span>
  )
}

/** 作り込み度メーター（0-100） */
export function CompletenessMeter({ mix }: { mix: MixWithRelations }) {
  const score = mixCompleteness(mix)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>作り込み度</span>
      <span
        className="relative overflow-hidden rounded-full"
        style={{ width: 96, height: 6, background: 'var(--color-smoke-700)' }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${score}%`, background: 'var(--color-ember)' }}
        />
      </span>
      <span className="text-xs" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>{score}</span>
    </div>
  )
}
