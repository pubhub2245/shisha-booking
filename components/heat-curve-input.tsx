'use client'

import { useState } from 'react'
import type { HeatPoint } from '@/lib/types/database'
import { HeatCurveChart } from '@/components/heat-curve-chart'

export function HeatCurveInput({ initial }: { initial?: HeatPoint[] }) {
  const [points, setPoints] = useState<HeatPoint[]>(
    initial && initial.length >= 2 ? [...initial].sort((a, b) => a.t - b.t) : [
      { t: 0, v: 40 },
      { t: 10, v: 80 },
      { t: 20, v: 60 },
    ]
  )

  const sorted = [...points].sort((a, b) => a.t - b.t)
  const value = sorted.length >= 2 ? JSON.stringify(sorted) : ''

  function update(i: number, patch: Partial<HeatPoint>) {
    setPoints((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function add() {
    const lastT = points.length ? Math.max(...points.map((p) => p.t)) : 0
    setPoints((ps) => [...ps, { t: lastT + 10, v: 60 }])
  }
  function remove(i: number) {
    setPoints((ps) => (ps.length > 2 ? ps.filter((_, idx) => idx !== i) : ps))
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="heat_curve" value={value} />

      {/* preview */}
      <div className="card p-3">
        <HeatCurveChart points={sorted} />
      </div>

      {/* editor rows */}
      <div className="flex flex-col gap-2">
        {points.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="field flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={180}
                value={p.t}
                onChange={(e) => update(i, { t: Number(e.target.value) || 0 })}
                className="w-14"
                style={{ padding: '8px 8px' }}
                aria-label="経過分"
              />
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>分</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="range"
                min={1}
                max={100}
                value={p.v}
                onChange={(e) => update(i, { v: Number(e.target.value) })}
                className="flex-1"
                style={{ accentColor: 'var(--color-ember)' }}
                aria-label="火力"
              />
              <div className="field" style={{ width: 68 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={p.v}
                  onChange={(e) => update(i, { v: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
                  style={{ padding: '8px 8px' }}
                  aria-label="火力の数値"
                />
              </div>
            </div>
            <button type="button" onClick={() => remove(i)} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              削除
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="btn btn-ghost self-start text-sm">＋ 時点を追加</button>
      <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        経過時間（分）ごとの火力（1〜100）を入れると、上の折れ線グラフになります（2点以上で表示）。
      </p>
    </div>
  )
}
