'use client'

import { useRef, useState } from 'react'
import type { HeatPoint, HeatEvent } from '@/lib/types/database'
import { HEAT_EVENT_OPTIONS, heatEventMeta, COAL_STATE_OPTIONS } from '@/lib/heat'

const W = 340
const H = 190
const padL = 34
const padR = 12
const padT = 16
const padB = 26

export function HeatCurveEditor({
  initialCurve,
  initialEvents,
  steepMinutes,
  steepHeat,
}: {
  initialCurve?: HeatPoint[]
  initialEvents?: HeatEvent[]
  steepMinutes?: number
  steepHeat?: number
}) {
  const [points, setPoints] = useState<HeatPoint[]>(
    initialCurve && initialCurve.length >= 2
      ? [...initialCurve].sort((a, b) => a.t - b.t)
      : // 初期値：約2時間（120分）想定の平均的な熱カーブ
        // むらしで立ち上げ→序盤ピーク→中盤の管理→終盤ゆるやかに下降
        [
          { t: 0, v: 30 },
          { t: 10, v: 70 },
          { t: 30, v: 75 },
          { t: 60, v: 65 },
          { t: 90, v: 55 },
          { t: 120, v: 40 },
        ]
  )
  const [events, setEvents] = useState<HeatEvent[]>(initialEvents ?? [])
  const [drag, setDrag] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // 数値入力の一時バッファ。入力中は空文字も許容し、確定時（blur）に補完する。
  const [buf, setBuf] = useState<{ key: string; val: string } | null>(null)
  const bufVal = (key: string, fallback: number) => (buf && buf.key === key ? buf.val : String(fallback))

  const sorted = [...points].sort((a, b) => a.t - b.t)
  const maxT = Math.max(30, ...points.map((p) => p.t), ...events.map((e) => e.t))
  const x = (t: number) => padL + (maxT ? (t / maxT) * (W - padL - padR) : 0)
  const y = (v: number) => padT + (1 - Math.min(100, Math.max(0, v)) / 100) * (H - padT - padB)

  function toDomain(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect()
    const sx = (clientX - rect.left) * (W / rect.width)
    const sy = (clientY - rect.top) * (H / rect.height)
    let t = ((sx - padL) / (W - padL - padR)) * maxT
    let v = (1 - (sy - padT) / (H - padT - padB)) * 100
    t = Math.round(Math.min(maxT, Math.max(0, t)) * 2) / 2
    v = Math.round(Math.min(100, Math.max(1, v)))
    return { t, v }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drag == null) return
    const { t, v } = toDomain(e.clientX, e.clientY)
    setPoints((ps) => ps.map((p, i) => (i === drag ? { t, v } : p)))
  }
  function startDrag(i: number, e: React.PointerEvent) {
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    setDrag(i)
  }
  function addAt(e: React.PointerEvent) {
    const { t, v } = toDomain(e.clientX, e.clientY)
    setPoints((ps) => [...ps, { t, v }])
  }

  const curveValue = sorted.length >= 2 ? JSON.stringify(sorted) : ''
  const eventsValue =
    events.length > 0
      ? JSON.stringify(
          [...events]
            .filter((ev) => typeof ev.t === 'number' && ev.type)
            .sort((a, b) => a.t - b.t)
        )
      : ''

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="heat_curve" value={curveValue} />
      <input type="hidden" name="heat_events" value={eventsValue} />

      {/* interactive graph */}
      <div className="card p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ maxWidth: 460, touchAction: 'none', cursor: 'crosshair' }}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          {/* bands */}
          {[
            { lo: 66, hi: 100, fill: 'rgb(224 85 42 / 0.06)', label: '強' },
            { lo: 33, hi: 66, fill: 'rgb(213 153 43 / 0.06)', label: '中' },
            { lo: 0, hi: 33, fill: 'rgb(31 138 118 / 0.06)', label: '弱' },
          ].map((b) => (
            <g key={b.label}>
              <rect x={padL} y={y(b.hi)} width={W - padL - padR} height={y(b.lo) - y(b.hi)} fill={b.fill} />
              <text x={W - padR - 2} y={(y(b.hi) + y(b.lo)) / 2 + 3} textAnchor="end" fontSize="8" fill="var(--color-ash-dim)">{b.label}</text>
            </g>
          ))}
          {/* grid */}
          {[0, 25, 50, 75, 100].map((lv) => (
            <g key={lv}>
              <line x1={padL} x2={W - padR} y1={y(lv)} y2={y(lv)} stroke="var(--line)" strokeWidth="1" />
              <text x={padL - 6} y={y(lv) + 3} textAnchor="end" fontSize="9" fill="var(--color-ash-dim)">{lv}</text>
            </g>
          ))}
          {/* click-to-add background */}
          <rect
            x={padL}
            y={padT}
            width={W - padL - padR}
            height={H - padT - padB}
            fill="transparent"
            onPointerDown={addAt}
          />
          {/* 蒸らし区間 */}
          {steepMinutes && steepMinutes > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={padL} y={padT} width={Math.max(0, x(Math.min(steepMinutes, maxT)) - padL)} height={H - padT - padB} fill="rgb(31 138 118 / 0.10)" />
              <line x1={x(Math.min(steepMinutes, maxT))} x2={x(Math.min(steepMinutes, maxT))} y1={padT} y2={H - padB} stroke="var(--color-coal)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <text x={padL + 3} y={padT + 9} fontSize="8" fill="var(--color-coal)" style={{ fontWeight: 700 }}>♨️蒸らし</text>
              {steepHeat && steepHeat > 0 && (
                <>
                  <line x1={padL} x2={x(Math.min(steepMinutes, maxT))} y1={y(steepHeat)} y2={y(steepHeat)} stroke="var(--color-coal)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <circle cx={x(Math.min(steepMinutes, maxT))} cy={y(steepHeat)} r="4" fill="var(--color-coal)" stroke="#fff" strokeWidth="1.5" />
                  <text x={padL + 3} y={y(steepHeat) - 3} fontSize="8" fill="var(--color-coal)" style={{ fontWeight: 700 }}>到達{steepHeat}</text>
                </>
              )}
            </g>
          )}
          {/* event markers */}
          {events.map((e, i) => (
            <g key={i}>
              <line x1={x(e.t)} x2={x(e.t)} y1={padT} y2={H - padB} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x(e.t)} y={padT - 4} textAnchor="middle" fontSize="11">{heatEventMeta(e.type).icon}</text>
            </g>
          ))}
          {/* line */}
          <polyline points={sorted.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')} fill="none" stroke="var(--color-ember)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* draggable points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(p.t)}
              cy={y(p.v)}
              r="7"
              fill="var(--color-ember)"
              stroke="#fff"
              strokeWidth="2"
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => startDrag(i, e)}
            />
          ))}
        </svg>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          点をドラッグで火力・時間を調整／グラフ内をタップで点を追加／各時点の「🔥炭」に個数と燃え具合（新・半・終）を記録できます（任意）
        </p>
        <p className="mt-1 text-[0.68rem] leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 火力は「弱(0-33)／中(33-66)／強(66-100)」の目安。炭の種類・個数・ボウル・部屋の気温で体感は変わるため、
          数値そのものより<b>「時間経過でどう上下させるか」の形</b>を参考にしてください。難しければ入力は任意です。
        </p>
      </div>

      {/* numeric rows */}
      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          const idx = points.indexOf(p)
          return (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <div className="field flex items-center gap-1">
                <input
                  type="number" inputMode="decimal" min={0} max={180} step={0.5}
                  value={bufVal('t' + idx, p.t)}
                  onChange={(e) => {
                    const raw = e.target.value
                    setBuf({ key: 't' + idx, val: raw })
                    if (raw !== '') {
                      const n = Number(raw)
                      if (!Number.isNaN(n)) setPoints((ps) => ps.map((q, i) => (i === idx ? { ...q, t: Math.max(0, Math.min(180, n)) } : q)))
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setPoints((ps) => ps.map((q, i) => (i === idx ? { ...q, t: 0 } : q)))
                    setBuf(null)
                  }}
                  className="w-14" style={{ padding: '8px 8px' }} aria-label="経過分"
                />
                <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>分</span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2" style={{ minWidth: 150 }}>
                <input
                  type="range" min={1} max={100} value={p.v}
                  onChange={(e) => setPoints((ps) => ps.map((q, i) => (i === idx ? { ...q, v: Number(e.target.value) } : q)))}
                  className="flex-1" style={{ accentColor: 'var(--color-ember)' }} aria-label="火力"
                />
                <div className="field" style={{ width: 64 }}>
                  <input
                    type="number" inputMode="numeric" min={1} max={100}
                    value={bufVal('v' + idx, p.v)}
                    onChange={(e) => {
                      const raw = e.target.value
                      setBuf({ key: 'v' + idx, val: raw })
                      if (raw !== '') {
                        const n = Number(raw)
                        if (!Number.isNaN(n)) setPoints((ps) => ps.map((q, i) => (i === idx ? { ...q, v: Math.min(100, Math.max(1, n)) } : q)))
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') setPoints((ps) => ps.map((q, i) => (i === idx ? { ...q, v: 1 } : q)))
                      setBuf(null)
                    }}
                    style={{ padding: '8px 8px' }} aria-label="火力の数値"
                  />
                </div>
              </div>
              {/* キューブ炭の個数（任意・玄人向け） */}
              <div className="field flex items-center gap-1" title="この時点のキューブ炭の個数（任意）">
                <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>🔥炭</span>
                <input
                  type="number" inputMode="numeric" min={0} max={20} step={1}
                  value={p.coals ?? ''} placeholder="—"
                  onChange={(e) => {
                    const raw = e.target.value
                    setPoints((ps) => ps.map((q, i) => {
                      if (i !== idx) return q
                      if (raw === '') return { t: q.t, v: q.v }
                      return { ...q, coals: Math.max(0, Math.min(20, Number(raw) || 0)) }
                    }))
                  }}
                  className="w-12" style={{ padding: '8px 6px' }} aria-label="この時点の炭の個数"
                />
              </div>
              {/* その時点の炭の燃え具合。同じ3個でも熾したてと終盤では温度が違う。 */}
              <div className="flex items-center gap-1" title="この時点の炭の燃え具合（任意）">
                {COAL_STATE_OPTIONS.map((o) => {
                  const active = p.coalState === o.v
                  return (
                    <button
                      key={o.v}
                      type="button"
                      aria-pressed={active}
                      title={o.l}
                      onClick={() =>
                        setPoints((ps) =>
                          ps.map((q, i) => {
                            if (i !== idx) return q
                            if (active) {
                              // もう一度押したら未入力に戻す
                              const rest: HeatPoint = { t: q.t, v: q.v }
                              if (q.coals != null) rest.coals = q.coals
                              return rest
                            }
                            return { ...q, coalState: o.v }
                          })
                        )
                      }
                      className="rounded border px-1.5 py-1 text-[0.68rem]"
                      style={{
                        borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                        background: active ? 'var(--accent-tint)' : 'transparent',
                        color: active ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {o.short}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={() => setPoints((ps) => (ps.length > 2 ? ps.filter((_, i) => i !== idx) : ps))} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={() => setPoints((ps) => [...ps, { t: Math.max(0, ...ps.map((p) => p.t)) + 10, v: 60 }])} className="btn btn-ghost self-start text-sm">＋ 時点を追加</button>

      {/* coal events */}
      <div className="divider mt-2" />
      <div className="text-sm" style={{ fontWeight: 600, color: 'var(--color-ash)' }}>炭イベント（任意）</div>
      <div className="flex flex-col gap-2">
        {events.map((ev, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <div className="field flex items-center gap-1">
              <input
                type="number" inputMode="decimal" min={0} max={180} step={0.5}
                value={bufVal('et' + i, ev.t)}
                onChange={(e) => {
                  const raw = e.target.value
                  setBuf({ key: 'et' + i, val: raw })
                  if (raw !== '') {
                    const n = Number(raw)
                    if (!Number.isNaN(n)) setEvents((es) => es.map((q, idx) => (idx === i ? { ...q, t: Math.max(0, Math.min(180, n)) } : q)))
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') setEvents((es) => es.map((q, idx) => (idx === i ? { ...q, t: 0 } : q)))
                  setBuf(null)
                }}
                className="w-14" style={{ padding: '8px 8px' }} aria-label="経過分"
              />
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>分</span>
            </div>
            <div className="field" style={{ minWidth: 130 }}>
              <select value={ev.type} onChange={(e) => setEvents((es) => es.map((q, idx) => (idx === i ? { ...q, type: e.target.value } : q)))}>
                {HEAT_EVENT_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>{o.icon} {o.l}</option>
                ))}
              </select>
            </div>
            <div className="field flex-1" style={{ minWidth: 120 }}>
              <input value={ev.note ?? ''} onChange={(e) => setEvents((es) => es.map((q, idx) => (idx === i ? { ...q, note: e.target.value } : q)))} placeholder="メモ（任意）" />
            </div>
            <button type="button" onClick={() => setEvents((es) => es.filter((_, idx) => idx !== i))} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEvents((es) => [...es, { t: 10, type: 'add', note: '' }])} className="btn btn-ghost self-start text-sm">＋ 炭イベントを追加</button>
    </div>
  )
}
