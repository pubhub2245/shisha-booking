/* 和の伝統色でまとめた円形アイコン。多色の"飴色"を避け、苔緑・朱土・藍・利休茶で統一。 */
const PRESETS = {
  green: { from: '#4f8f6b', to: '#356a4d', glow: 'rgb(47 97 71 / 0.30)' },   // 苔緑
  amber: { from: '#c65b3c', to: '#a5382a', glow: 'rgb(165 56 42 / 0.28)' },  // 朱土（赭）
  blue: { from: '#3f6a8c', to: '#2c5069', glow: 'rgb(44 80 105 / 0.28)' },   // 藍
  violet: { from: '#8f7355', to: '#6f5638', glow: 'rgb(111 86 56 / 0.26)' }, // 利休茶
} as const

export type OrbPreset = keyof typeof PRESETS

/** 光彩（グロー）付きの円形アイコン。SmokeDex 風の“かっこいい”質感を、煙道の色で。 */
export function IconOrb({
  children,
  preset = 'green',
  size = 56,
}: {
  children: React.ReactNode
  preset?: OrbPreset
  size?: number
}) {
  const c = PRESETS[preset]
  return (
    <span
      className="orb relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* glow halo */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          inset: -size * 0.34,
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 68%)`,
        }}
      />
      {/* filled circle */}
      <span
        className="relative flex items-center justify-center rounded-full text-white"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(145deg, ${c.from}, ${c.to})`,
          fontSize: size * 0.44,
          boxShadow: `0 10px 24px -8px ${c.glow}, inset 0 1px 0 rgb(255 255 255 / 0.25)`,
        }}
      >
        {children}
      </span>
    </span>
  )
}
