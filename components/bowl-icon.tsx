// ボウル（クレイ/ファンネル等）の種類を表す自作イラストアイコン（断面図的な線画）。

export function BowlIcon({ type, size = 44 }: { type: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (type) {
    case 'clay':
      // 素焼きボウル：底に複数の穴
      return (
        <svg {...common}>
          <path d="M14 16h20l-3 16H17z" />
          <circle cx="21" cy="30" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="24" cy="30.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="27" cy="30" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'funnel':
      // ファンネル：中央に高い突起（1穴）＋高いふち
      return (
        <svg {...common}>
          <path d="M13 16h22l-3 16H16z" />
          <path d="M24 30v-9" />
          <circle cx="24" cy="19.5" r="1.6" />
        </svg>
      )
    case 'vortex':
      // ボルテックス：中央の突起の周りに複数の穴
      return (
        <svg {...common}>
          <path d="M13 16h22l-3 16H16z" />
          <path d="M24 31v-6" />
          <circle cx="20" cy="29" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="28" cy="29" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="22" cy="27" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="26" cy="27" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'silicone':
      // シリコン：角丸で柔らかい印象、底に穴
      return (
        <svg {...common}>
          <path d="M15 16h18a2 2 0 0 1 2 2l-3 12a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2L13 18a2 2 0 0 1 2-2z" />
          <circle cx="22" cy="30" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="26" cy="30" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M14 16h20l-3 16H17z" />
          <path d="M22 22a2 2 0 0 1 3.6 1.2c0 1.4-1.6 1.4-1.6 2.6" />
          <circle cx="24" cy="29.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
