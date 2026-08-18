import type { MapAxis } from '@/lib/method-diff'

/**
 * 設計空間の地図。
 *
 * 「この作り方が一番良い」は言わない。作り手たちがどの範囲で作っていて、
 * いま自分が作った一台がその中のどこにあるかだけを示す。
 * 他人の体験データを1件も使わないので、参加者が0人の状態でも成立する
 * （docs/第一テーマ_設計再構成.md §3）。
 */
export function DesignSpaceMap({ axes, compact = false }: { axes: MapAxis[]; compact?: boolean }) {
  if (axes.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {axes.map((axis) => (
        <div key={axis.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs" style={{ color: 'var(--color-ash)', fontWeight: 700 }}>
              {axis.label}
            </span>
            {axis.kind === 'number' && axis.mine != null && (
              <span className="text-[0.65rem]" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                あなた {axis.mine}
              </span>
            )}
          </div>

          {axis.kind === 'number' ? (
            <NumberAxis min={axis.min} max={axis.max} mine={axis.mine} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {axis.values.map((v) => {
                const mine = axis.mine === v.value
                return (
                  <span
                    key={v.value}
                    className="rounded-full border px-2 py-0.5 text-[0.7rem]"
                    style={{
                      borderColor: mine ? 'var(--color-ember)' : 'var(--line)',
                      background: mine ? 'var(--accent-tint)' : 'transparent',
                      color: mine ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)',
                      fontWeight: mine ? 700 : 500,
                    }}
                  >
                    {v.label}
                    {!compact && v.count > 1 && <span className="ml-1 opacity-60">{v.count}</span>}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function NumberAxis({ min, max, mine }: { min: number; max: number; mine: number | null }) {
  // min === max のケースは buildDesignSpace 側で除外済みなので、ここでは 0 除算は起きない
  const pct = mine == null ? null : Math.min(100, Math.max(0, ((mine - min) / (max - min)) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-right text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>
        {min}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full" style={{ background: 'var(--line)' }}>
        {pct != null && (
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${pct}%`, background: 'var(--color-ember)' }}
            aria-hidden
          />
        )}
      </div>
      <span className="w-8 shrink-0 text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>
        {max}
      </span>
    </div>
  )
}
