import type { HeatPoint } from '@/lib/types/database'

/** 熱管理カーブの折れ線グラフ（横軸=経過分, 縦軸=火力0-100）。依存ライブラリなしの純SVG。 */
export function HeatCurveChart({ points }: { points: HeatPoint[] }) {
  const pts = [...(points ?? [])]
    .filter((p) => typeof p.t === 'number' && typeof p.v === 'number')
    .sort((a, b) => a.t - b.t)
  if (pts.length < 2) return null

  const W = 320
  const H = 170
  const padL = 34
  const padR = 12
  const padT = 12
  const padB = 26
  const maxT = Math.max(30, ...pts.map((p) => p.t))
  const x = (t: number) => padL + (maxT ? (t / maxT) * (W - padL - padR) : 0)
  const y = (v: number) => padT + (1 - Math.min(100, Math.max(0, v)) / 100) * (H - padT - padB)

  const line = pts.map((p) => `${x(p.t)},${y(p.v)}`).join(' ')
  const xTicks = [0, Math.round(maxT / 2), maxT]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="熱管理カーブ" style={{ maxWidth: 420 }}>
      {/* Y grid + labels */}
      {[0, 25, 50, 75, 100].map((lv) => (
        <g key={lv}>
          <line x1={padL} x2={W - padR} y1={y(lv)} y2={y(lv)} stroke="var(--line)" strokeWidth="1" />
          <text x={padL - 6} y={y(lv) + 3} textAnchor="end" fontSize="9" fill="var(--color-ash-dim)">
            {lv}
          </text>
        </g>
      ))}
      {/* X ticks */}
      {xTicks.map((t, i) => (
        <text key={i} x={x(t)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--color-ash-dim)">
          {t}分
        </text>
      ))}
      {/* area under line */}
      <polygon
        points={`${x(pts[0].t)},${H - padB} ${line} ${x(pts[pts.length - 1].t)},${H - padB}`}
        fill="var(--accent-tint)"
      />
      {/* line */}
      <polyline points={line} fill="none" stroke="var(--color-ember)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={x(p.t)} cy={y(p.v)} r="3.5" fill="var(--color-ember)" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
