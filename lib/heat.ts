// 炭・熱源セットアップの選択肢とラベル

export const HMS_OPTIONS = [
  { v: 'foil', l: 'アルミホイル' },
  { v: 'kaloud', l: 'Kaloud系（ロータス等）' },
  { v: 'provost', l: 'Provost系' },
  { v: 'other', l: 'その他HMS' },
] as const

export const CHARCOAL_OPTIONS = [
  { v: 'cube', l: 'キューブ' },
  { v: 'flat', l: 'フラット' },
  { v: 'coconut', l: 'ココナッツ' },
  { v: 'ogatan', l: 'オガ炭' },
  { v: 'other', l: 'その他' },
] as const

export function hmsLabel(v: string | null | undefined): string | null {
  return HMS_OPTIONS.find((o) => o.v === v)?.l ?? null
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
