/**
 * 変えられる五つ。煙道が扱う「作り方の設計空間」そのもの。
 *
 * ここはデータではなく、この製品が何を比べているのかの宣言。
 * 実在しない method や数字は一切出さない（架空のデータを作らないという決まり）。
 * 図は 1.4px の単線に統一し、色は currentColor で周りに従わせる。
 */
const S = {
  width: 34,
  height: 34,
  viewBox: '0 0 32 32',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const AXES = [
  {
    k: 'ボウル',
    d: '器の形で、熱の当たり方が変わる',
    svg: (
      <svg {...S}>
        <path d="M8 11h16l-2.5 12h-11z" />
        <path d="M16 23v-7" />
        <circle cx="16" cy="14.6" r="1.2" />
      </svg>
    ),
  },
  {
    k: '詰め方',
    d: 'ふんわりか、密か。空気の通りが変わる',
    svg: (
      <svg {...S}>
        <path d="M8 12h16l-2.5 11h-11z" />
        <path d="M10 15.5h12M10.6 18.5h10.8M11.2 21h9.6" opacity=".75" />
      </svg>
    ),
  },
  {
    k: 'HMD',
    d: '炭と葉のあいだに何を挟むか',
    svg: (
      <svg {...S}>
        <path d="M9 20h14l-1.5 4h-11z" />
        <path d="M9.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M22.5 17.5h4.5" strokeWidth="2.2" />
        <path d="M16 11.5v3M13 12.6v2.2M19 12.6v2.2" opacity=".7" />
      </svg>
    ),
  },
  {
    k: '炭',
    d: '数と置き位置。一つ動かすだけで味が動く',
    svg: (
      <svg {...S}>
        <rect x="8.5" y="13" width="6.5" height="6.5" rx="1.2" />
        <rect x="17" y="13" width="6.5" height="6.5" rx="1.2" />
        <rect x="12.75" y="20.5" width="6.5" height="6.5" rx="1.2" opacity=".55" />
      </svg>
    ),
  },
  {
    k: '火入れ',
    d: 'いつ足し、いつ外すか。時間の設計',
    svg: (
      <svg {...S}>
        <path d="M6 24h20" opacity=".5" />
        <path d="M6 21c3.5 0 4-9 7.5-9S17 20 20.5 20 24 14 26 13.5" />
      </svg>
    ),
  },
]

/**
 * 横一列の帯。隣のセクション（帯・レール・チップの塊・縦の道）と
 * 骨格が重ならないように、ここだけは「等分に区切られた一列」にしている。
 */
export function Axes() {
  return (
    <ul className="axes" data-rise>
      {AXES.map((a) => (
        <li key={a.k} className="axis">
          <span className="axis-fig" aria-hidden>{a.svg}</span>
          <span className="axis-k">{a.k}</span>
          <span className="axis-d">{a.d}</span>
        </li>
      ))}
    </ul>
  )
}
