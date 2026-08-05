import type { HeatPoint, HeatEvent } from '@/lib/types/database'
import { heatEventMeta } from '@/lib/heat'

export type CurveSeries = { label: string; color: string; points: HeatPoint[] }

/** 熱管理カーブの折れ線グラフ（横軸=経過分, 縦軸=火力0-100）。純SVG。
 *  - points: 単一カーブ / series: 複数カーブ重ね比較
 *  - events: 炭イベントのマーカー
 *  - 背景に火力の目安帯（弱/中/強） */
export function HeatCurveChart({
  points,
  events,
  series,
  steepMinutes,
}: {
  points?: HeatPoint[]
  events?: HeatEvent[]
  series?: CurveSeries[]
  steepMinutes?: number
}) {
  const allSeries: CurveSeries[] =
    series && series.length > 0
      ? series
      : points && points.length >= 2
        ? [{ label: '', color: 'var(--color-ember)', points }]
        : []
  const evts = (events ?? []).filter((e) => typeof e.t === 'number').sort((a, b) => a.t - b.t)
  if (allSeries.length === 0 && evts.length === 0) return null

  const W = 340
  const H = 190
  const padL = 34
  const padR = 12
  const padT = 16
  const padB = 26
  const cleaned = allSeries.map((s) => ({
    ...s,
    points: [...s.points].filter((p) => typeof p.t === 'number' && typeof p.v === 'number').sort((a, b) => a.t - b.t),
  }))
  const maxT = Math.max(
    30,
    ...cleaned.flatMap((s) => s.points.map((p) => p.t)),
    ...evts.map((e) => e.t)
  )
  const x = (t: number) => padL + (maxT ? (t / maxT) * (W - padL - padR) : 0)
  const y = (v: number) => padT + (1 - Math.min(100, Math.max(0, v)) / 100) * (H - padT - padB)
  const xTicks = [0, Math.round(maxT / 2), maxT]

  // 火力の目安帯
  const bands = [
    { lo: 66, hi: 100, label: '強', fill: 'rgb(224 85 42 / 0.06)' },
    { lo: 33, hi: 66, label: '中', fill: 'rgb(213 153 43 / 0.06)' },
    { lo: 0, hi: 33, label: '弱', fill: 'rgb(31 138 118 / 0.06)' },
  ]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="熱管理カーブ" style={{ maxWidth: 460 }}>
        {/* 火力帯 */}
        {bands.map((b) => (
          <g key={b.label}>
            <rect x={padL} y={y(b.hi)} width={W - padL - padR} height={y(b.lo) - y(b.hi)} fill={b.fill} />
            <text x={W - padR - 2} y={(y(b.hi) + y(b.lo)) / 2 + 3} textAnchor="end" fontSize="8" fill="var(--color-ash-dim)">
              {b.label}
            </text>
          </g>
        ))}

        {/* Y grid */}
        {[0, 25, 50, 75, 100].map((lv) => (
          <g key={lv}>
            <line x1={padL} x2={W - padR} y1={y(lv)} y2={y(lv)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 6} y={y(lv) + 3} textAnchor="end" fontSize="9" fill="var(--color-ash-dim)">{lv}</text>
          </g>
        ))}

        {/* X ticks */}
        {xTicks.map((t, i) => (
          <text key={i} x={x(t)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--color-ash-dim)">{t}分</text>
        ))}

        {/* 蒸らし区間 */}
        {steepMinutes && steepMinutes > 0 && (
          <g>
            <rect x={padL} y={padT} width={Math.max(0, x(Math.min(steepMinutes, maxT)) - padL)} height={H - padT - padB} fill="rgb(31 138 118 / 0.10)" />
            <line x1={x(Math.min(steepMinutes, maxT))} x2={x(Math.min(steepMinutes, maxT))} y1={padT} y2={H - padB} stroke="var(--color-coal)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <text x={padL + 3} y={padT + 9} fontSize="8" fill="var(--color-coal)" style={{ fontWeight: 700 }}>♨️蒸らし{steepMinutes}分</text>
          </g>
        )}

        {/* イベントマーカー */}
        {evts.map((e, i) => (
          <g key={i}>
            <line x1={x(e.t)} x2={x(e.t)} y1={padT} y2={H - padB} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={x(e.t)} y={padT - 4} textAnchor="middle" fontSize="11">{heatEventMeta(e.type).icon}</text>
          </g>
        ))}

        {/* カーブ */}
        {cleaned.map((s, si) =>
          s.points.length >= 2 ? (
            <g key={si}>
              {allSeries.length === 1 && (
                <polygon
                  points={`${x(s.points[0].t)},${H - padB} ${s.points.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')} ${x(s.points[s.points.length - 1].t)},${H - padB}`}
                  fill="var(--accent-tint)"
                />
              )}
              <polyline
                points={s.points.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.points.map((p, i) => (
                <circle key={i} cx={x(p.t)} cy={y(p.v)} r="3" fill={s.color} stroke="#fff" strokeWidth="1.3" />
              ))}
              {/* キューブ炭の個数（単一カーブ表示のときのみ、玄人向け） */}
              {allSeries.length === 1 &&
                s.points.map((p, i) =>
                  typeof p.coals === 'number' && p.coals > 0 ? (
                    <text
                      key={`c${i}`}
                      x={x(p.t)}
                      y={y(p.v) - 8}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--color-ember-hot)"
                      style={{ fontWeight: 700 }}
                    >
                      🔥{p.coals}
                    </text>
                  ) : null
                )}
            </g>
          ) : null
        )}
      </svg>

      {/* 凡例（比較時） */}
      {series && series.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-ash)' }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: s.color, display: 'inline-block' }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* イベント凡例 */}
      {evts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {evts.map((e, i) => (
            <span key={i} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              {heatEventMeta(e.type).icon} {e.t}分：{e.note || heatEventMeta(e.type).l}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
