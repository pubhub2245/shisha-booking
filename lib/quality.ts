import type { Mix } from '@/lib/types/database'

/**
 * 「ちゃんとした作り方が書かれているか」を数値化する作り込み度スコア（0-100）。
 * 熱管理はシーシャの核なので配点を厚くしている。
 */
export function mixCompleteness(m: Partial<Mix> & { mix_flavors?: { ratio: number | null }[] }): number {
  let s = 0
  if (m.description && m.description.trim().length >= 20) s += 10
  if (m.taste_tags && m.taste_tags.length > 0) s += 5
  if (m.strength) s += 5

  // フレーバーに割合が入っているか
  const flavors = m.mix_flavors ?? []
  if (flavors.length > 0 && flavors.every((f) => f.ratio != null)) s += 10

  // 熱管理（核）
  if (m.heat_curve && m.heat_curve.length >= 2) s += 25
  if (m.heat_events && m.heat_events.length > 0) s += 8
  if (m.heat_management && m.heat_management.trim().length >= 10) s += 8
  if (m.placement_note && m.placement_note.trim().length >= 6) s += 9

  // 炭・ボウルセットアップ
  const setup = [m.hms_type, m.charcoal_type, m.charcoal_count != null ? 'c' : null, m.wind_cover != null ? 'w' : null].filter(Boolean).length
  s += Math.min(10, setup * 3)
  if (m.bowl_type) s += 5
  if (m.pack_style) s += 5

  return Math.min(100, s)
}

export type QualityLevel = 'high' | 'medium' | 'low'

export function completenessLevel(score: number): QualityLevel {
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

/** 代表（定番）選定・並び替え用の総合スコア。作り込みを主、いいねを従。 */
export function mixQuality(m: Mix & { mix_flavors?: { ratio: number | null }[] }): number {
  return mixCompleteness(m) * 2 + Math.min(m.like_count ?? 0, 60)
}
