/** サイトの絶対URL（OGP・QR・共有リンク用）。env が無ければ本番URLにフォールバック。 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'
