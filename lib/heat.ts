// 炭・熱源セットアップの選択肢とラベル

// ヒートマネジメントシステム（HMS）の種類。
// icon は components/hms-icon.tsx の自作イラストと対応（写真は権利の都合で自作の図で代替）。
export type HmsOption = {
  v: string
  l: string // 日本語名
  en: string // ブランド/英語名
  desc: string // 特徴（1文）
  icon: string
}

export const HMS_OPTIONS: readonly HmsOption[] = [
  {
    v: 'lotus',
    l: 'ロータス',
    en: 'KALOUD Lotus',
    desc: 'アルミ不要で炭を直置き。フタの開閉で火力を細かく調整できる万能な定番。初心者にも◎',
    icon: 'lotus',
  },
  {
    v: 'provost',
    l: 'プロヴォスト',
    en: 'Provost',
    desc: 'ボウルに被せて密閉性を高めるタイプ。熱がこもりやすく立ち上がりが速い。アルミと併用。',
    icon: 'provost',
  },
  {
    v: 'turkish',
    l: 'ターキッシュリッド',
    en: 'Turkish Lid',
    desc: '穴あきの金属フタを炭の上に被せる伝統的な方法。安価だが火力調整は大まかめ。',
    icon: 'turkish',
  },
  {
    v: 'steamulation',
    l: 'スチームレーション',
    en: 'Steamulation',
    desc: 'エアフロー調整を備えたハイエンドHMS。精密な熱・煙管理ができる上級者向け。',
    icon: 'steamulation',
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

export const CHARCOAL_OPTIONS = [
  { v: 'cube', l: 'キューブ' },
  { v: 'flat', l: 'フラット' },
  { v: 'coconut', l: 'ココナッツ' },
  { v: 'ogatan', l: 'オガ炭' },
  { v: 'other', l: 'その他' },
] as const

export const BOWL_OPTIONS = [
  { v: 'clay', l: 'クレイ' },
  { v: 'funnel', l: 'ファンネル' },
  { v: 'vortex', l: 'ハリカ/ボルテックス' },
  { v: 'silicone', l: 'シリコン' },
  { v: 'other', l: 'その他' },
] as const

export const PACK_OPTIONS = [
  { v: 'fluff', l: 'ふんわり（フラッフ）' },
  { v: 'flat', l: 'フラット' },
  { v: 'dense', l: '密盛り（デンス）' },
  { v: 'overpack', l: 'オーバーパック' },
  { v: 'other', l: 'その他' },
] as const

export function bowlLabel(v: string | null | undefined): string | null {
  return BOWL_OPTIONS.find((o) => o.v === v)?.l ?? null
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
