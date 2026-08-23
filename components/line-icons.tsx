/**
 * 本文用の線画。
 *
 * 絵文字をやめる理由はナビと同じ。端末ごとに絵が変わり、色が勝手に付く。
 * 暗い地の上に土星色や原色の絵文字が並ぶと、それだけで間に合わせに見える。
 *
 * ここは全部 1.5px の単線、色は必ず currentColor。
 * 名前で引けるようにしてあるので、データ側は文字列を持つだけでいい。
 */
export type IconName =
  | 'draw' | 'noburn' | 'taste' | 'smoke'
  | 'leaf' | 'bowl' | 'thermo' | 'foil' | 'fire' | 'timer' | 'layers' | 'dome'
  | 'crown' | 'seal' | 'book' | 'shop'
  | 'target' | 'chart' | 'jar' | 'phone'
  | 'camera' | 'pin' | 'flame'

const S = (size: number) => ({
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

const PATHS: Record<IconName, React.ReactNode> = {
  /** 吸いやすい＝空気が通る */
  draw: (
    <>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h14a3 3 0 1 1-3 3" />
      <path d="M3 16h7" />
    </>
  ),
  /** 焦げていない＝火に斜線 */
  noburn: (
    <>
      <path d="M12 3c.6 2.5 2 3.4 3.2 4.8A6.2 6.2 0 0 1 17 12a5 5 0 0 1-10 0c0-1.5.6-2.6 1.4-3.6" />
      <path d="M4 4l16 16" />
    </>
  ),
  /** 味がある＝一滴 */
  taste: <path d="M12 3.5c2.8 3.5 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2.2-5.5 5-9Z" />,
  /** 煙が出る */
  smoke: (
    <>
      <path d="M12 21c0-3.2-3-4.3-3-7 0-2.2 3-2.7 3-5 0-1.7-1-2.5-1-3.6 0-1 .6-1.7 1.6-2.4" />
      <path d="M16.4 18.4c1.4-1.5 1.6-3 .6-4.4" />
      <path d="M7.4 15.4C6.2 14.3 6 13 6.7 11.8" />
    </>
  ),
  /** 葉＝フレーバー */
  leaf: (
    <>
      <path d="M19.5 4.5c.6 6.4-2.4 11-7.3 12.4-3.3.9-6-.5-6.9-3.2C4 10 6.6 6.9 11.3 5.7c2.5-.6 5.3-.8 8.2-1.2Z" />
      <path d="M5 20c2.4-4.2 5.6-7.3 9.6-9.3" />
    </>
  ),
  /** ボウル＝盛り方 */
  bowl: (
    <>
      <path d="M5 8h14l-2.2 5.5a3 3 0 0 1-2.8 1.9h-4a3 3 0 0 1-2.8-1.9Z" />
      <path d="M10.5 15.4V19M13.5 15.4V19M8.5 21h7" />
    </>
  ),
  /** 温度計＝熱管理 */
  thermo: (
    <>
      <path d="M10 14.8V5.5a2 2 0 1 1 4 0v9.3a4 4 0 1 1-4 0Z" />
      <path d="M16 7h2M16 10h2" />
    </>
  ),
  /** アルミホイル＝穴の開いた一枚 */
  foil: (
    <>
      <path d="M4 7.5 8 5l4 2.5L16 5l4 2.5v9L16 19l-4-2.5L8 19l-4-2.5Z" />
      <path d="M9 11h.01M13 10h.01M15.5 13h.01M11 14h.01" />
    </>
  ),
  /** 火入れ */
  fire: <path d="M12 3c.6 2.5 2 3.4 3.2 4.8A6.2 6.2 0 0 1 17 12a5 5 0 0 1-10 0c0-2.3 1.4-3.7 2.4-5.2.5.8 1 1.3 1.7 1.6C11.6 6.6 11.7 4.7 12 3Z" />,
  /** 提供のタイミング */
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.8M9.5 2.5h5" />
    </>
  ),
  /** 積み重ね＝作り方の基本 */
  layers: (
    <>
      <path d="m12 3 8 4-8 4-8-4Z" />
      <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
    </>
  ),
  /** HMD＝ふた */
  dome: (
    <>
      <path d="M4.5 15a7.5 7.5 0 0 1 15 0Z" />
      <path d="M3 18h18M9 15V11M12 15V9.5M15 15V11" />
    </>
  ),
  /** 王＝冠 */
  crown: (
    <>
      <path d="M4 8.5 7 13l5-7 5 7 3-4.5V18H4Z" />
      <path d="M4 21h16" />
    </>
  ),
  /** 証＝落款 */
  seal: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  /** 作品集 */
  book: (
    <>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5v16H6a2 2 0 0 0-2 2Z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2Z" />
    </>
  ),
  /** 店 */
  shop: (
    <>
      <path d="M3.5 8.5 5 4h14l1.5 4.5a3 3 0 0 1-5.7 1.4 3 3 0 0 1-5.6 0A3 3 0 0 1 3.5 8.5Z" />
      <path d="M5 10.5V20h14v-9.5M10 20v-5h4v5" />
    </>
  ),
  /** 狙い */
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 10.5v3" />
    </>
  ),
  /** 伸びる */
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 17v-4M12 17V9M16 17v-6M20 17V6" />
    </>
  ),
  /** 在庫の棚 */
  jar: (
    <>
      <path d="M8.5 3.5h7v2.2c0 .8.3 1.5.9 2.1l.7.7c.6.6.9 1.3.9 2.1V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19v-8.4c0-.8.3-1.5.9-2.1l.7-.7c.6-.6.9-1.3.9-2.1Z" />
      <path d="M6 13h12" />
    </>
  ),
  /** 手元の画面 */
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 5.5h3M11 18.5h2" />
    </>
  ),
  /** 写真 */
  camera: (
    <>
      <path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h2L9 4.5h6l1.5 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  /** 場所 */
  pin: (
    <>
      <path d="M12 21c4-4.4 6-7.6 6-10.2a6 6 0 1 0-12 0C6 13.4 8 16.6 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  /** 人気＝火 */
  flame: <path d="M12 3c.6 2.5 2 3.4 3.2 4.8A6.2 6.2 0 0 1 17 12a5 5 0 0 1-10 0c0-2.3 1.4-3.7 2.4-5.2.5.8 1 1.3 1.7 1.6C11.6 6.6 11.7 4.7 12 3Z" />,
}

export function LineIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg {...S(size)}>{PATHS[name]}</svg>
}
