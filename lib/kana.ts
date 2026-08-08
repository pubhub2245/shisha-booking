// 検索の表記ゆれ吸収（ひらがな⇔カタカナ・大文字小文字）

export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

export function toKatakana(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

/** 検索語の表記ゆれバリエーション（重複除去・空除去）。最大4件に抑える。 */
export function searchVariants(term: string): string[] {
  const base = term.trim()
  if (!base) return []
  const set = new Set<string>([base, toHiragana(base), toKatakana(base), base.toLowerCase()])
  return [...set].filter(Boolean).slice(0, 4)
}
