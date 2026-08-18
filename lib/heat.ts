// 炭・熱源セットアップの選択肢とラベル

// ヒートマネジメントシステム（HMS）の種類。
// icon は components/hms-icon.tsx の自作イラストと対応（写真は権利の都合で自作の図で代替）。
export type HmsOption = {
  v: string
  l: string // 日本語名
  en: string // ブランド/英語名
  desc: string // 特徴（1文）
  icon: string
  bowls?: readonly string[] // 相性の良いボウルの v（おすすめ順）
  bowlNote?: string // ボウル相性の補足（任意）
}

export const HMS_OPTIONS: readonly HmsOption[] = [
  {
    v: 'lotus',
    l: 'ロータス',
    en: 'KALOUD Lotus',
    desc: 'アルミ不要で炭を直置き。フタの開閉で火力を細かく調整できる万能な定番。初心者にも◎',
    icon: 'lotus',
    bowls: ['funnel', 'phunnel', 'silicone', 'vortex'],
    bowlNote: '基本的にどんなボウルにも対応する万能タイプ。ファンネル系やシリコンファンネルが扱いやすい。',
  },
  {
    v: 'provost',
    l: 'アマボースト',
    en: 'Amavost',
    desc: 'ボウルに被せて密閉性を高めるタイプ。装甲が薄く直置きに近い熱。立ち上がりが速く濃いめ・煙量重視向け。',
    icon: 'provost',
    bowls: ['funnel', 'phunnel', 'clay'],
    bowlNote: 'ファンネル系と好相性。装甲が薄く直置きに近いので、火力はやや慎重に管理を。',
  },
  {
    v: 'turkish',
    l: 'ターキッシュリッド',
    en: 'Turkish Lid',
    desc: '穴あきの金属カップを炭に被せる伝統的な方法。安価だが火力調整は大まかめ。',
    icon: 'turkish',
    bowls: ['funnel', 'phunnel', 'clay'],
    bowlNote: 'ファンネル系・クレイと幅広く使える定番のフタ。',
  },
  {
    v: 'steamulation',
    l: 'スチームレーション（高さ調節式）',
    en: 'Steamulation',
    desc: '炭とフレーバーの距離を多段階で調整できるハイエンドHMS。精密な熱・煙管理ができる上級者向け。',
    icon: 'steamulation',
    bowls: ['phunnel', 'funnel'],
    bowlNote: '底の段差で各種ボウルに対応。フェニックス/ファンネル系と好相性。',
  },
  {
    v: 'nagrani',
    l: 'ナグラニ',
    en: 'Na Grani',
    desc: 'ロシアンスタイル由来のカゴ状HMD。ステンレス製でストレート／ファンネルボウルに乗せて使う。',
    icon: 'nagrani',
    bowls: ['funnel', 'phunnel'],
    bowlNote: 'ファンネルボウル向け。ロータス用の溝があるハーモニー系ボウルは滑りやすく不向き。',
  },
  {
    v: 'aot',
    l: 'アップルオントップ',
    en: 'Apple On Top',
    desc: 'りんご等を器にして炭を乗せるスタイル。まろやかな熱で香りづけも楽しめる。',
    icon: 'aot',
  },
  {
    v: 'foil',
    l: 'アルミホイル（直置き）',
    en: 'Foil',
    desc: 'HMSを使わずアルミに穴を開けて炭を乗せる基本の方法。手軽で道具いらず。',
    icon: 'foil',
    bowlNote: 'クレイ・ファンネルなど、ほぼ全てのボウルで使える。',
  },
  { v: 'other', l: 'その他', en: '', desc: 'その他のヒートマネジメント。', icon: 'other' },
]

// 旧データ（value）との互換エイリアス
const HMS_ALIASES: Record<string, string> = { kaloud: 'lotus' }

export function hmsOption(v: string | null | undefined): HmsOption | null {
  if (!v) return null
  const key = HMS_ALIASES[v] ?? v
  return HMS_OPTIONS.find((o) => o.v === key) ?? null
}

/** そのHMSに相性の良いボウルの一覧（BowlOption[]）を返す */
export function hmsBowls(v: string | null | undefined): BowlOption[] {
  const opt = hmsOption(v)
  if (!opt?.bowls) return []
  return opt.bowls
    .map((b) => bowlOption(b))
    .filter((b): b is BowlOption => b != null)
}

export const CHARCOAL_OPTIONS = [
  { v: 'cube', l: 'キューブ' },
  { v: 'flat', l: 'フラット' },
  { v: 'ogatan', l: 'オガ炭' },
  { v: 'other', l: 'その他' },
] as const

// フラット炭の置き方（縦置き/横置きで味が変わる）
/**
 * カーブ上の炭の燃え具合。写真ほど正確ではないが、1タップで残せて意味が通る粒度にしている。
 * 「炭3個」と書いてあっても、熾したての3個と終盤の3個では与える熱が違う。
 */
export const COAL_STATE_OPTIONS = [
  { v: 'fresh', l: '熾したて', short: '新' },
  { v: 'half', l: '半分', short: '半' },
  { v: 'late', l: '終盤', short: '終' },
] as const

export function coalStateLabel(v: string | null | undefined): string | null {
  return COAL_STATE_OPTIONS.find((o) => o.v === v)?.l ?? null
}
export function coalStateShort(v: string | null | undefined): string | null {
  return COAL_STATE_OPTIONS.find((o) => o.v === v)?.short ?? null
}

/** 「26mm × 3個」。サイズが未入力なら個数だけ。 */
export function charcoalAmountLabel(sizeMm: number | null | undefined, count: number | null | undefined): string | null {
  if (count == null && sizeMm == null) return null
  if (sizeMm == null) return `${count}個`
  if (count == null) return `${sizeMm}mm`
  return `${sizeMm}mm × ${count}個`
}

export const CHARCOAL_ORIENTATION_OPTIONS = [
  { v: 'vertical', l: '縦置き' },
  { v: 'horizontal', l: '横置き' },
] as const

export function orientationLabel(v: string | null | undefined): string | null {
  return CHARCOAL_ORIENTATION_OPTIONS.find((o) => o.v === v)?.l ?? null
}

// ボウルの種類（HMSと同様にイラスト付きで選ばせる）
export type BowlOption = { v: string; l: string; en: string; desc: string; icon: string }
export const BOWL_OPTIONS: readonly BowlOption[] = [
  { v: 'clay', l: 'クレイ', en: 'Clay / Egyptian', desc: '素焼き（陶器）の定番。底の穴からシロップが下に落ちやすいため、シロップ少なめの中東系フレーバーと好相性。', icon: 'clay' },
  { v: 'funnel', l: 'ファンネル', en: 'Funnel', desc: '中央に大きな穴＋高いふち。シロップが落ちにくく甘さを保ちやすい。シロップ多めのフレーバー向け。', icon: 'funnel' },
  { v: 'vortex', l: 'ハリカ/ボルテックス', en: 'Vortex', desc: '中央の突起の周りに穴。煙が渦を巻き、シロップ漏れも防ぐ。', icon: 'vortex' },
  { v: 'phunnel', l: 'ファンネル（フェニックス系）', en: 'Phunnel', desc: '中央1穴タイプ。シロップが溜まりやすく、濃いフレーバーやシロップ多めに向く。', icon: 'funnel' },
  { v: 'silicone', l: 'シリコン', en: 'Silicone', desc: '熱に強く割れにくい。手入れが簡単で初心者向け。', icon: 'silicone' },
  { v: 'other', l: 'その他', en: '', desc: 'その他のボウル。', icon: 'other' },
]

export function bowlOption(v: string | null | undefined): BowlOption | null {
  if (!v) return null
  return BOWL_OPTIONS.find((o) => o.v === v) ?? null
}

// フレーバーの盛り方（HMS/ボウルと同様にイラスト付きで選ばせる）
export type PackOption = { v: string; l: string; en: string; desc: string; icon: string }
export const PACK_OPTIONS: readonly PackOption[] = [
  { v: 'fluff', l: 'ふんわり', en: 'Fluff', desc: '空気を含ませてふわっと盛る。軽く吸えて煙も出やすい。焦げにくい定番。', icon: 'fluff' },
  { v: 'layered', l: 'ミルフィーユ', en: 'Layered', desc: '葉を平らに重ねて層状にする。火が均一に入り、味が安定しやすい。', icon: 'layered' },
  { v: 'dense', l: 'ぎっしり', en: 'Dense', desc: 'ギチギチに密に詰める。濃厚で長持ちするが、しっかり火力が要る。', icon: 'dense' },
  { v: 'flat', l: 'フラット', en: 'Flat', desc: 'ふちと同じ高さに平らにならす。オールラウンドで扱いやすい。', icon: 'flat' },
  { v: 'overpack', l: 'オーバーパック', en: 'Overpack', desc: 'ふちより高く山盛りにする。HMS／アルミとの間隔に注意。', icon: 'overpack' },
  { v: 'other', l: 'その他', en: '', desc: 'その他の盛り方。', icon: 'other' },
]

export function packOption(v: string | null | undefined): PackOption | null {
  if (!v) return null
  return PACK_OPTIONS.find((o) => o.v === v) ?? null
}

export function bowlLabel(v: string | null | undefined): string | null {
  return bowlOption(v)?.l ?? null
}
export function packLabel(v: string | null | undefined): string | null {
  return PACK_OPTIONS.find((o) => o.v === v)?.l ?? null
}

export function hmsLabel(v: string | null | undefined): string | null {
  return hmsOption(v)?.l ?? null
}
export function charcoalLabel(v: string | null | undefined): string | null {
  return CHARCOAL_OPTIONS.find((o) => o.v === v)?.l ?? null
}
export function windCoverLabel(v: boolean | null | undefined): string | null {
  if (v === true) return '被せる'
  if (v === false) return '被せない'
  return null
}

export const HEAT_EVENT_OPTIONS = [
  { v: 'add', l: '炭を追加', icon: '➕' },
  { v: 'remove', l: '炭を減らす', icon: '➖' },
  { v: 'ash', l: '灰を落とす', icon: '🧹' },
  { v: 'rotate', l: 'ローテーション', icon: '🔄' },
  { v: 'other', l: 'その他', icon: '📍' },
] as const

export function heatEventMeta(v: string | null | undefined) {
  return HEAT_EVENT_OPTIONS.find((o) => o.v === v) ?? { v: 'other', l: 'イベント', icon: '📍' }
}

// カーブ比較用のライン色
export const CURVE_COLORS = ['#1f8a76', '#e0552a', '#4a86e8', '#a479e2', '#d5992b', '#c0407a']
