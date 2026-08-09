// 味わいタグ（投稿・検索で共通利用）。自由入力ではなく選択式にするためのマスタ。

export const TASTE_TAGS = ['甘い', 'スッキリ', '濃厚', 'さっぱり', '爽快'] as const
export const TYPE_TAGS = ['フルーツ', 'シトラス', 'ミント', 'ベリー', 'デザート', 'トロピカル', 'スパイス', 'ドリンク', 'お茶', '和'] as const

export const ALL_TASTE_TAGS: string[] = [...TASTE_TAGS, ...TYPE_TAGS]
