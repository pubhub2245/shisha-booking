/**
 * ユーザー名（@ハンドル）の正規化。
 * ユーザーが先頭に付けがちな「@」や空白を除去し、二重@（@@name）を防ぐ。
 * 記号のうち @ と空白のみ除去（日本語ハンドル等は保持）。
 */
export function sanitizeUsername(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/[@\s]/g, '').slice(0, 30)
}
