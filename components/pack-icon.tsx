// フレーバーの盛り方を表す自作イラストアイコン（ボウル断面図＋盛りの形）。
// ふんわり／ミルフィーユ／ぎっしり／フラット／オーバーパックを視覚的に区別する。

// ボウル断面（各アイコンで共通に使う静的な線）。
// ネストしたコンポーネント定義（lint: static-components）を避けるため、要素を定数として持つ。
const bowlOutline = (
  <>
    <path d="M11 20 L15 37 H33 L37 20" />
    <path d="M9 20 H39" opacity="0.45" />
  </>
)

export function PackIcon({ type, size = 44 }: { type: string; size?: number }) {
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
    case 'fluff':
      // 空気を含んだ、ぼこぼこの軽い山＋空気の粒
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M13 20a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0" />
          <circle cx="18" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="27" cy="14.8" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="32" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'layered':
      // 平らな層を積み重ねる（ミルフィーユ）
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M13 20.5H35" />
          <path d="M12.4 24.5H35.6" opacity="0.85" />
          <path d="M13 28.5H35" opacity="0.85" />
          <path d="M13.7 32.5H34.3" opacity="0.85" />
        </svg>
      )
    case 'dense':
      // ぎっしり密に詰める（粒を敷き詰め＋平らな上面）
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M13 21H35" />
          {[
            [16, 24.5], [20, 24.5], [24, 24.5], [28, 24.5], [32, 24.5],
            [17, 28.5], [21, 28.5], [24.5, 28.5], [28.5, 28.5], [32, 28.5],
            [18, 32.5], [23, 32.5], [28, 32.5],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.95" fill="currentColor" stroke="none" />
          ))}
        </svg>
      )
    case 'flat':
      // ふちと同じ高さに平らにならす（強調した水平面）
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M11.5 20.5H36.5" strokeWidth={2.6} />
          <path d="M13 27H35" opacity="0.45" />
          <path d="M14 32H34" opacity="0.45" />
        </svg>
      )
    case 'overpack':
      // ふちより高く山盛り（大きく高いドーム）
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M12 20 Q24 3 36 20" />
        </svg>
      )
    default:
      // その他（？）
      return (
        <svg {...common}>
          {bowlOutline}
          <path d="M21.7 13.2a2.4 2.4 0 0 1 4.3 1.4c0 1.6-1.9 1.8-1.9 3.1" />
          <circle cx="24" cy="21" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
