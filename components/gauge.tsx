/**
 * 熱の目盛り ── このサイトだけの記号。
 *
 * 「そのフレーバーが何通りで作られているか」を、数字より先に厚みで見せる。
 * 棒の本数＝作り方の数（上限あり）、棒の高さ＝全体の中での多さ。
 * 同じ文法をセクションの罫にも使い、サイト全体で一つの記号にしている。
 */
export function Gauge({
  n,
  max,
  bars = 5,
  hot = false,
  size,
  label,
}: {
  /** その対象が持つ作り方の数 */
  n: number
  /** 画面内で一番多いものの数。棒の高さの基準 */
  max: number
  /** 棒の最大本数 */
  bars?: number
  /** 火の色で出す（＝特別な熱を持つもの） */
  hot?: boolean
  size?: 'lg'
  /** 読み上げ用の言い換え。既定は「N通りの作り方」 */
  label?: string
}) {
  const safeMax = Math.max(1, max)
  const shown = Math.max(1, Math.min(bars, n))
  const ratio = Math.min(1, n / safeMax)

  return (
    <span
      className={`gauge${size === 'lg' ? ' gauge-lg' : ''}${hot ? ' is-hot' : ''}`}
      role="img"
      aria-label={label ?? `${n}通りの作り方`}
    >
      {Array.from({ length: shown }, (_, i) => (
        // 左から右へ、だんだん高くなる。束の右肩が「どこまで熱いか」になる
        <i
          key={i}
          style={{ ['--h' as string]: (ratio * (i + 1)) / shown }}
        />
      ))}
    </span>
  )
}
