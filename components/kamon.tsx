/**
 * 家紋（かもん）風の単色シンボル。絵文字を廃し、和の意匠で図鑑の格を出す。
 * すべて currentColor で描画するため、色は親の color を継承する
 * （IconOrb の中では白、地の文では墨/朱など）。
 */
export type KamonName =
  | 'hanabishi' // 花菱
  | 'shippou'   // 七宝
  | 'seigaiha'  // 青海波
  | 'sakura'    // 桜
  | 'igeta'     // 井桁

function sakuraPetals() {
  // 中心の周りに5弁（72°間隔）
  const cx = 12, cy = 12, r = 5.4, pr = 3.1
  const pts = [-90, -18, 54, 126, 198].map((deg) => {
    const rad = (deg * Math.PI) / 180
    return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy + r * Math.sin(rad)).toFixed(2) }
  })
  return (
    <g fill="currentColor">
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={pr} />
      ))}
      <circle cx={cx} cy={cy} r={1.7} fill="currentColor" opacity={0.55} />
    </g>
  )
}

const SHAPES: Record<KamonName, React.ReactNode> = {
  hanabishi: (
    <path
      fill="currentColor"
      d="M12 2.5c1.9 4.9 4.1 7.1 9 9-4.9 1.9-7.1 4.1-9 9-1.9-4.9-4.1-7.1-9-9 4.9-1.9 7.1-4.1 9-9Z"
    />
  ),
  shippou: (
    <g fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="5.5" r="5" />
      <circle cx="12" cy="18.5" r="5" />
      <circle cx="5.5" cy="12" r="5" />
      <circle cx="18.5" cy="12" r="5" />
    </g>
  ),
  seigaiha: (
    <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M3 18a9 9 0 0 1 18 0" />
      <path d="M6 18a6 6 0 0 1 12 0" />
      <path d="M9 18a3 3 0 0 1 6 0" />
    </g>
  ),
  sakura: sakuraPetals(),
  igeta: (
    <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M9 3.5V20.5M15 3.5V20.5M3.5 9H20.5M3.5 15H20.5" />
    </g>
  ),
}

export function Kamon({
  name,
  size = 18,
  className,
  title,
}: {
  name: KamonName
  size?: number
  className?: string
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {SHAPES[name]}
    </svg>
  )
}
