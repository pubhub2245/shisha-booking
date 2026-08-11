// 都道府県 ↔ 地方（地域別ランキング用）。
// prefecture の値は都道府県の短い正規名（例: '東京', '大阪', '北海道'）で保存する。

export type RegionKey =
  | '北海道・東北'
  | '関東'
  | '中部'
  | '近畿'
  | '中国'
  | '四国'
  | '九州・沖縄'

/** 地方 → 所属都道府県（表示順） */
export const REGIONS: { key: RegionKey; emoji: string; prefs: string[] }[] = [
  { key: '北海道・東北', emoji: '🗻', prefs: ['北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島'] },
  { key: '関東', emoji: '🗼', prefs: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'] },
  { key: '中部', emoji: '🏔️', prefs: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知'] },
  { key: '近畿', emoji: '🏯', prefs: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'] },
  { key: '中国', emoji: '⛩️', prefs: ['鳥取', '島根', '岡山', '広島', '山口'] },
  { key: '四国', emoji: '🌉', prefs: ['徳島', '香川', '愛媛', '高知'] },
  { key: '九州・沖縄', emoji: '🌺', prefs: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'] },
]

/** すべての都道府県（保存順＝北から） */
export const PREFECTURES: string[] = REGIONS.flatMap((r) => r.prefs)

const PREF_TO_REGION = new Map<string, RegionKey>()
for (const r of REGIONS) for (const p of r.prefs) PREF_TO_REGION.set(p, r.key)

/** 都道府県 → 地方。未知/未設定なら null。 */
export function regionOf(prefecture: string | null | undefined): RegionKey | null {
  if (!prefecture) return null
  return PREF_TO_REGION.get(prefecture) ?? null
}

/** 有効な都道府県名か。 */
export function isPrefecture(v: string | null | undefined): boolean {
  return !!v && PREF_TO_REGION.has(v)
}

export const REGION_EMOJI = new Map<RegionKey, string>(REGIONS.map((r) => [r.key, r.emoji]))
