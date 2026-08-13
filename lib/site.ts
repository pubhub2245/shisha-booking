/**
 * サイトの絶対URL（OGP・QR・共有リンク用）。
 * 正式な公開URLは環境変数 NEXT_PUBLIC_SITE_URL で指定する（独自ドメイン等）。
 * 未設定時は現在の本番URLにフォールバック（リンク切れを防ぐため実在するドメインにする）。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'

/**
 * メール機能（確認メール・パスワード再設定メール）が使えるか。
 * SMTP＋独自ドメインを設定したら NEXT_PUBLIC_EMAIL_ENABLED=true にする。
 * 既定は false（＝メール無し運用。Supabase側は Confirm email OFF）。
 */
export const EMAIL_ENABLED = process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true'

/**
 * ブランド定義（唯一の出典）。表記ゆれを防ぐため、名称・タグライン等はここを参照する。
 *
 * 「煙道（えんどう / ENDOH）」= 煙の通り道。茶道・華道・香道に連なる“道”として、
 * 日本流に洗練されたシーシャの作法＝「王道シーシャ図鑑」を体現するブランド名。
 * 意匠は和（washi × 墨 × 苔緑 × 朱の落款・明朝体）。ロゴマークは朱の落款に白抜きの「煙」。
 */
export const BRAND = {
  /** 和名（正式表記） */
  name: '煙道',
  /** 読み */
  reading: 'えんどう',
  /** 英字表記（海外・ロゴ・識別子用） */
  nameEn: 'ENDOH',
  /** 和英併記のフル表記 */
  full: '煙道 ENDOH',
  /** ロゴマーク（落款）の一文字 */
  mark: '煙',
  /** タグライン（情緒） */
  tagline: '煙を、味わう。',
  /** カテゴリ（機能を一言で） */
  category: '王道シーシャ図鑑',
  /** author_id が null（運営提供サンプル）の既定表示名 */
  editorial: '煙道 編集部',
} as const

/** メタタイトル等で使う「煙道 ENDOH — 王道シーシャ図鑑」 */
export const BRAND_TITLE = `${BRAND.full} — ${BRAND.category}`
