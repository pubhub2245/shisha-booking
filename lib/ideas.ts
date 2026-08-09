// 意見箱のカテゴリ（シーシャアプリ向け）

export const IDEA_CATEGORIES = [
  { v: 'post', l: '投稿・作り方', icon: '📝' },
  { v: 'flavors', l: 'フレーバー図鑑', icon: '🍃' },
  { v: 'heat', l: '熱管理・研究ログ', icon: '🔥' },
  { v: 'shop', l: '店舗', icon: '🏠' },
  { v: 'ui', l: 'UI・使いやすさ', icon: '✨' },
  { v: 'other', l: 'その他', icon: '💬' },
] as const

export const IDEA_CATEGORY_VALUES: string[] = IDEA_CATEGORIES.map((c) => c.v)

export function ideaCategory(v: string | null | undefined) {
  return IDEA_CATEGORIES.find((c) => c.v === v) ?? IDEA_CATEGORIES[IDEA_CATEGORIES.length - 1]
}
