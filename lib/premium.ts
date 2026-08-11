// 有料ノート（一部を課金で解錠）の共通定義

/** ロック可能なパーツ（作り方ノートの中で有料にできる単位） */
export const LOCKABLE_SECTIONS = [
  { v: 'heat_curve', l: '熱管理カーブ（グラフ）', icon: '🔥' },
  { v: 'heat_notes', l: '熱管理の補足・置き方', icon: '📝' },
  { v: 'setup', l: 'セットアップ（炭・HMS等）', icon: '🪨' },
  { v: 'gear', l: '機材・ギア（本体/ボウル/炭など）', icon: '🛠' },
  { v: 'secrets', l: 'こだわり・核心（下処理/配合の狙い等）', icon: '🔒' },
] as const

export type LockableSection = (typeof LOCKABLE_SECTIONS)[number]['v']

export function sectionLabel(v: string): string {
  return LOCKABLE_SECTIONS.find((s) => s.v === v)?.l ?? v
}

/** 価格の下限・上限（円） */
export const PRICE_MIN = 100
export const PRICE_MAX = 5000

export function normalizePrice(raw: unknown): number | null {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, n))
}
