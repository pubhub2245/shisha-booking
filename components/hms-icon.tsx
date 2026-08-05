// HMS（ヒートマネジメントシステム）の種類を表す自作イラストアイコン。
// 実機写真は権利・配信の都合で使わず、形が一目でわかる線画で表現している。

export function HmsIcon({ type, size = 44 }: { type: string; size?: number }) {
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
    case 'lotus':
      return (
        <svg {...common}>
          <path d="M6 29h7" />
          <path d="M13 27c0-5 5-8 11-8s11 3 11 8" />
          <path d="M11 28c0 3 6 6 13 6s13-3 13-6" />
          <path d="M13 27c0 3 5 5 11 5s11-2 11-5" />
          <path d="M24 20l3 3-3 3-3-3z" />
        </svg>
      )
    case 'provost':
      return (
        <svg {...common}>
          <circle cx="24" cy="15" r="2.4" />
          <path d="M24 17.4V21" />
          <path d="M12 33c0-8 5-12 12-12s12 4 12 12" />
          <path d="M12 33h24" />
          <path d="M15.5 28.5h17" opacity="0.5" />
        </svg>
      )
    case 'turkish':
      // 穴あきの金属円筒カップ＋側面の穴＋黒い持ち手（実機の形に寄せた線画）
      return (
        <svg {...common}>
          {/* 持ち手（黒いグリップ） */}
          <path d="M33 25h9" strokeWidth={3} />
          {/* 円筒の側面 */}
          <path d="M11 15v18" />
          <path d="M33 15v18" />
          {/* 底（手前側のカーブ） */}
          <path d="M11 33q11 5 22 0" />
          {/* 開口部のリム */}
          <ellipse cx="22" cy="15" rx="11" ry="3.4" />
          {/* 内部中央のチューブ */}
          <circle cx="22" cy="15" r="1.3" fill="currentColor" stroke="none" />
          {/* 側面の穴（2列） */}
          {[23, 28].map((cy) =>
            [15, 20, 25, 30].map((cx) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill="currentColor" stroke="none" />
            ))
          )}
        </svg>
      )
    case 'steamulation':
      return (
        <svg {...common}>
          <rect x="16" y="13" width="16" height="19" rx="4" />
          <path d="M16 22h16" />
          <circle cx="24" cy="17.5" r="1.4" />
          <path d="M20 32v3M28 32v3" />
        </svg>
      )
    case 'aot':
      return (
        <svg {...common}>
          <path d="M24 16c-1-3 1-5 4.5-5" />
          <path d="M24 16c-6-3-11 1-11 8 0 6.5 5 12 11 12s11-5.5 11-12c0-7-5-11-11-8z" />
        </svg>
      )
    case 'foil':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="27" rx="13" ry="5" />
          <path d="M12 24c4-2 8-2 12 0s8 2 12 0" opacity="0.5" />
          <circle cx="20" cy="27" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="24" cy="28" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="28" cy="27" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="11" />
          <path d="M21 21a3 3 0 0 1 5.5 1.6c0 2-2.5 2.2-2.5 4" />
          <circle cx="24" cy="31" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
