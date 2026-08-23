/**
 * 見出しの脇に置く丸。
 *
 * 以前は苔緑・朱土・藍・利休茶の4色をグラデーションで塗り分け、光彩まで付けていた。
 * 地を暗い方ひとつにした時点で、これは方針と噛み合わなくなった。
 * 決まりは「アクセントは緑ひとつ。橙は実際に火がある所だけ」。
 * 意味の無い所に4色が並ぶと、その決まりが嘘になる。
 *
 * なのでここは色を持たない。地の階調と髪の毛一本の輪郭だけで、中身は currentColor。
 * 目立たせたい時は色ではなく、中身（漢字一文字か線画）で区別する。
 */
export function IconOrb({
  children,
  size = 56,
}: {
  children: React.ReactNode
  size?: number
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: 'var(--color-smoke-800)',
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.08)',
        color: 'var(--color-cream)',
        fontSize: size * 0.4,
      }}
    >
      {children}
    </span>
  )
}
