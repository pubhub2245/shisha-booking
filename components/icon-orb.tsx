const PRESETS = {
  green: { from: '#2ba088', to: '#1f8a76', glow: 'rgb(31 138 118 / 0.38)' },
  amber: { from: '#f0b445', to: '#e0552a', glow: 'rgb(224 85 42 / 0.32)' },
  blue: { from: '#5b9bf0', to: '#3a6fd8', glow: 'rgb(74 134 232 / 0.32)' },
  violet: { from: '#a479e2', to: '#7c53c9', glow: 'rgb(164 121 226 / 0.32)' },
} as const

export type OrbPreset = keyof typeof PRESETS

/** 光彩（グロー）付きの円形アイコン。SmokeDex 風の“かっこいい”質感を、MixHubの色で。 */
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
      className="relative inline-flex shrink-0 items-center justify-center"
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
