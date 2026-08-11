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
