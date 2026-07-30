'use client'

import { useState } from 'react'
import type { HeatPoint } from '@/lib/types/database'
import { HeatCurveChart } from '@/components/heat-curve-chart'

const LEVELS = [
  { v: 1, l: '弱火' },
  { v: 2, l: '中弱' },
  { v: 3, l: '中火' },
  { v: 4, l: '中強' },
  { v: 5, l: '強火' },
]

export function HeatCurveInput({ initial }: { initial?: HeatPoint[] }) {
  const [points, setPoints] = useState<HeatPoint[]>(
    initial && initial.length >= 2 ? [...initial].sort((a, b) => a.t - b.t) : [
      { t: 0, v: 2 },
      { t: 10, v: 4 },
      { t: 20, v: 3 },
    ]
  )

  const sorted = [...points].sort((a, b) => a.t - b.t)
  const value = sorted.length >= 2 ? JSON.stringify(sorted) : ''

  function update(i: number, patch: Partial<HeatPoint>) {
    setPoints((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function add() {
    const lastT = points.length ? Math.max(...points.map((p) => p.t)) : 0
    setPoints((ps) => [...ps, { t: lastT + 10, v: 3 }])
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
                max={120}
                value={p.t}
                onChange={(e) => update(i, { t: Number(e.target.value) || 0 })}
                className="w-16"
                style={{ padding: '8px 10px' }}
                aria-label="経過分"
              />
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>分</span>
            </div>
            <div className="field flex-1">
              <select
                value={p.v}
                onChange={(e) => update(i, { v: Number(e.target.value) })}
                style={{ padding: '8px 10px' }}
                aria-label="火力"
              >
                {LEVELS.map((lv) => (
                  <option key={lv.v} value={lv.v}>{lv.l}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs"
              style={{ color: 'var(--color-ash-dim)' }}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="btn btn-ghost self-start text-sm">＋ 時点を追加</button>
      <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        経過時間ごとの火力を入れると、上の折れ線グラフになります（2点以上で表示）。
      </p>
    </div>
  )
}
