// 説明文・相性情報の出典（実在するシーシャ情報サイト）。
// 各説明は下記の一般的な解説に沿って記載し、画面に小さく出典リンクを表示する。
// ※ 一次情報の確認はユーザー（有識者）レビューを前提とし、リンク先で検証できるようにしている。

export type Source = { id: string; label: string; url: string }

const S = (id: string, label: string, url: string): Source => ({ id, label, url })

export const SOURCE = {
  cloudHms: S('cloudHms', 'CLOUD（HMS）', 'https://cloud-jp.net/hms-type/'),
  cloudTurkish: S('cloudTurkish', 'CLOUD（ターキッシュ）', 'https://cloud-jp.net/turkish-lid/'),
  eggHmd: S('eggHmd', 'EGG SHISHA', 'https://www.official-eggshisha.com/posts/best-shisha-hmd-devices-japan'),
  cloudBowl: S('cloudBowl', 'CLOUD（ボウル）', 'https://shop.cloud-jp.net/blogs/product-review/hookah-bowl-type'),
  marukiyaBowl: S('marukiyaBowl', 'マルキヤ', 'https://shisha-marukiya.com/blog/straight_funnel/'),
  cloudPack: S('cloudPack', 'CLOUD（盛り方）', 'https://cloud-jp.net/tips-pack-flavor/'),
  cloudMix: S('cloudMix', 'CLOUD（ミックス）', 'https://cloud-jp.net/flavor-mix-tips/'),
  jstHowto: S('jstHowto', 'Japan Shisha Times', 'https://www.japanshishatimes.jp/feature/howto-homemadeshisha-advanced-yutori'),
} as const

export const HMS_SOURCES: Source[] = [SOURCE.cloudHms, SOURCE.eggHmd]
export const BOWL_SOURCES: Source[] = [SOURCE.cloudBowl, SOURCE.marukiyaBowl]
export const PACK_SOURCES: Source[] = [SOURCE.cloudPack, SOURCE.cloudMix]
export const HMS_BOWL_SOURCES: Source[] = [SOURCE.cloudHms, SOURCE.eggHmd, SOURCE.cloudBowl, SOURCE.marukiyaBowl]
export const GUIDE_SOURCES: Source[] = [SOURCE.jstHowto, SOURCE.cloudPack, SOURCE.cloudMix]
