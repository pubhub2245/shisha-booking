/**
 * ナビの図。絵文字をやめて線画にする。
 *
 * 絵文字は端末ごとに絵が変わり、色も勝手に付く。暗い地の上では
 * それだけで「間に合わせ」に見える。ここでは全部 1.5px の単線で、
 * 色は必ず currentColor（＝周りの文字と同じ色）にしている。
 */
type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** 葉＝フレーバー */
export function IconLeaf({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M19.5 4.5c.6 6.4-2.4 11-7.3 12.4-3.3.9-6-.5-6.9-3.2C4 10 6.6 6.9 11.3 5.7c2.5-.6 5.3-.8 8.2-1.2Z" />
      <path d="M5 20c2.4-4.2 5.6-7.3 9.6-9.3" />
    </svg>
  )
}

/** 立ちのぼる煙＝いま進んでいる検証 */
export function IconSmoke({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 21c0-3.2-3-4.3-3-7 0-2.2 3-2.7 3-5 0-1.7-1-2.5-1-3.6 0-1 .6-1.7 1.6-2.4" />
      <path d="M16.4 18.4c1.4-1.5 1.6-3 .6-4.4" />
      <path d="M7.4 15.4C6.2 14.3 6 13 6.7 11.8" />
    </svg>
  )
}

/** 炭を置く＝記録する */
export function IconCoal({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  )
}

/** 検索 */
export function IconSearch({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

/** 人 */
export function IconUser({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-3.6 3.4-5.5 7-5.5s6.3 1.9 7 5.5" />
    </svg>
  )
}

/** 報せ */
export function IconBell({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M6 10a6 6 0 1 1 12 0c0 3.2.7 4.8 1.5 5.7.4.4.1 1.1-.5 1.1H5c-.6 0-.9-.7-.5-1.1C5.3 14.8 6 13.2 6 10Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
  )
}
