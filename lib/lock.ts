// ロック（有料ノート）と時限公開（タイムリリース）の判定を一元化する。
// 方針：このアプリの主役は「公開＝みんなの標準（図鑑）」。ロックは"最後のひと工夫"を守る補助輪。
//  - 日本代表／地方代表は「いま公開されているレシピ」だけが対象。
//  - unlock_at を過ぎたロックは自動的に解除（公開）扱いにする。

type LockMix = {
  premium: boolean
  locked_sections: string[] | null
  unlock_at: string | null
}

/** 時限公開の解禁時刻を過ぎているか。 */
export function unlockPassed(m: { unlock_at: string | null }): boolean {
  return !!m.unlock_at && Date.now() >= new Date(m.unlock_at).getTime()
}

/** いまロックが効いているか（＝一部が非公開）。時限公開を過ぎていれば false。 */
export function isActivelyLocked(m: LockMix): boolean {
  if (!m.premium) return false
  if (!(m.locked_sections && m.locked_sections.length > 0)) return false
  if (unlockPassed(m)) return false
  return true
}

/** 完全公開のレシピか（ロックが効いていない）。 */
export function isFullyOpen(m: LockMix): boolean {
  return !isActivelyLocked(m)
}
