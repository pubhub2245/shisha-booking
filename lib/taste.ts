// 味覚5軸（実際に吸った人による味の"強度"）。
// 投稿者が付ける mixes.taste_tags（味の"系統"）とは役割が別。

export type TasteAxis = 'sweetness' | 'coolness' | 'sourness' | 'richness' | 'heaviness'

/** V1で確定。軸の追加・削除はしない。 */
export const TASTE_AXES: {
  key: TasteAxis
  label: string
  /** 1 と 5 の意味（入力時の補助。長文にしない） */
  low: string
  high: string
}[] = [
  { key: 'sweetness', label: '甘さ', low: '控えめ', high: 'しっかり甘い' },
  { key: 'coolness', label: '爽快感', low: '清涼感なし', high: '強い清涼感' },
  { key: 'sourness', label: '酸味', low: 'ほぼなし', high: '強い酸味' },
  { key: 'richness', label: '濃厚さ', low: '軽く淡い', high: '非常に濃厚' },
  { key: 'heaviness', label: '重さ', low: '軽く吸える', high: '重厚・吸いごたえ' },
]

/** 平均値を出してよい最小の評価者数。これ未満は「データ収集中」。 */
export const MIN_RATERS_FOR_AVERAGE = 3

/**
 * 直接比較で「どこが違ったか」を選ぶ語。
 * 5軸の 1〜5 を2台ぶん思い出す必要がないよう、相対的な言葉だけにしている。
 * 値は DB にそのまま入るので、増減させるときは既存データの意味が変わらないか確認すること。
 */
export const COMPARISON_AXES = ['甘い', '軽い', '濃い', '涼しい', '重い', '分からない'] as const
export type ComparisonAxis = (typeof COMPARISON_AXES)[number]

/**
 * 自然言語タグの閾値（定数化して後から調整できるようにする）。
 * V1では複雑な分類をしない：各軸を単独で見て、強い/弱い側だけ言葉にする。
 */
export const TASTE_TAG_RULES: { axis: TasteAxis; min?: number; max?: number; label: string }[] = [
  { axis: 'sweetness', min: 4, label: '甘め' },
  { axis: 'sweetness', max: 2, label: '甘さ控えめ' },
  { axis: 'coolness', min: 4, label: '爽快' },
  { axis: 'sourness', min: 4, label: '酸味しっかり' },
  { axis: 'richness', min: 4, label: '濃厚' },
  { axis: 'heaviness', max: 2, label: '軽め' },
  { axis: 'heaviness', min: 4, label: '重め' },
]

export type TasteAxisSummary = { avg: number | null; count: number }
export type TasteSummary = Record<TasteAxis, TasteAxisSummary> & { raterCount: number }

/** 平均値を表示してよいか（母数が少ないうちは断定的な数値を見せない） */
export function canShowAverage(summary: TasteSummary): boolean {
  return summary.raterCount >= MIN_RATERS_FOR_AVERAGE
}

/**
 * 5軸平均から初心者向けの短い言葉を導く（例：甘め・爽快・軽め）。
 * 母数が足りないうちは何も出さない＝少数の評価で断定しない。
 */
export function tasteWords(summary: TasteSummary): string[] {
  if (!canShowAverage(summary)) return []
  const out: string[] = []
  for (const rule of TASTE_TAG_RULES) {
    const a = summary[rule.axis]
    if (a.avg == null || a.count === 0) continue
    if (rule.min != null && a.avg >= rule.min) out.push(rule.label)
    else if (rule.max != null && a.avg <= rule.max) out.push(rule.label)
  }
  return out
}

/** 評価状況の表示段階 */
export function tasteStage(summary: TasteSummary): 'none' | 'collecting' | 'ready' {
  if (summary.raterCount === 0) return 'none'
  return summary.raterCount >= MIN_RATERS_FOR_AVERAGE ? 'ready' : 'collecting'
}
