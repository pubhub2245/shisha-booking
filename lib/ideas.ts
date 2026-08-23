// 意見箱のカテゴリ（シーシャアプリ向け）

export const IDEA_CATEGORIES = [
  { v: 'post', l: '投稿・作り方' },
  { v: 'flavors', l: 'フレーバー図鑑' },
  { v: 'heat', l: '熱管理・研究ログ' },
  { v: 'shop', l: '店舗' },
  { v: 'ui', l: 'UI・使いやすさ' },
  { v: 'other', l: 'その他' },
] as const

export const IDEA_CATEGORY_VALUES: string[] = IDEA_CATEGORIES.map((c) => c.v)

export function ideaCategory(v: string | null | undefined) {
  return IDEA_CATEGORIES.find((c) => c.v === v) ?? IDEA_CATEGORIES[IDEA_CATEGORIES.length - 1]
}
