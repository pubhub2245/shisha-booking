/**
 * 年齢確認の判定。画面（components/age-gate.tsx）と、JS が動かないときの
 * 受け口（app/age/route.ts）の両方から同じ計算を使う。片方だけ直さないこと。
 */

/** 利用できる年齢の下限（喫煙関連の情報を扱うため） */
export const AGE_MIN = 20

/** 年齢確認の結果を覚えておくクッキー名（1年） */
export const AGE_OK_COOKIE = 'age_ok'
/** 「20歳未満だった」を短時間だけ覚えておくクッキー名（ページを再表示したときに断りを出すため） */
export const AGE_NG_COOKIE = 'age_ng'

export const AGE_OK_MAX_AGE = 60 * 60 * 24 * 365
export const AGE_NG_MAX_AGE = 60 * 10

/**
 * 生年・生月から満年齢を概算する。誕生月が未到来なら1引く（日までは聞かない）。
 * 年か月が無効なら null。
 */
export function ageFromYearMonth(year: unknown, month: unknown, today = new Date()): number | null {
  const y = Number(year)
  const m = Number(month)
  if (!Number.isInteger(y) || !Number.isInteger(m) || y < 1900 || m < 1 || m > 12) return null
  let age = today.getFullYear() - y
  if (m > today.getMonth() + 1) age -= 1
  return age
}

export function isOldEnough(year: unknown, month: unknown, today = new Date()): boolean {
  const age = ageFromYearMonth(year, month, today)
  return age !== null && age >= AGE_MIN
}

/** 戻り先はサイト内のパスだけ許す（外部サイトへ飛ばさない） */
export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string') return '/'
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
  return next
}
