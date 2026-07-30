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
