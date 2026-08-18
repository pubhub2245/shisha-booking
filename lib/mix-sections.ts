// ミックス詳細で「載せる項目」として投稿者がオン/オフできるセクション。
// hidden_sections に入っているキーは詳細ページで非表示にする。

export const MIX_DISPLAY_SECTIONS = [
  { v: 'setup', label: '器具・セットアップ', hint: 'HMS・ボウル・盛り方・炭・蒸らし' },
  { v: 'heat_curve', label: '熱管理カーブ', hint: '時間ごとの火力グラフ' },
  { v: 'heat_notes', label: '熱管理メモ・置き方', hint: '文章の補足' },
  { v: 'gear', label: '機材・ギア', hint: '本体・ボウル・HMS・炭・ベース' },
  { v: 'secrets', label: 'こだわり・核心', hint: '下処理・この作り方の狙い・提供のコツ' },
  { v: 'photos', label: '工程・写真', hint: '追加の写真' },
] as const

export const MIX_DISPLAY_SECTION_KEYS: string[] = MIX_DISPLAY_SECTIONS.map((s) => s.v)
