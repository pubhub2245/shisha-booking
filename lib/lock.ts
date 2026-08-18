// ロック（有料ノート）と時限公開（タイムリリース）の判定を一元化する。
// 方針：このアプリの主役は「公開＝みんなの標準（図鑑）」。ロックは"最後のひと工夫"を守る補助輪。
//  - 日本代表／地方代表は「いま公開されているレシピ」だけが対象。
//  - unlock_at を過ぎたロックは自動的に解除（公開）扱いにする。

/**
 * ロック機能そのものの表示スイッチ（2026-08 一時非表示）。
 *
 * false の間：
 *  - 投稿・編集フォームにロックの設定が出ない（保存もしない）
 *  - 作り方ページに有料ノートの表示・解錠導線が出ず、全項目が公開として描画される
 *  - 解錠（決済）のアクションは受け付けない
 *
 * DB のカラム（premium / price / locked_sections / unlock_at / mix_unlocks）と
 * 既存データはそのまま残してある。戻すときはここを true にすれば元の挙動に戻る。
 * ※ 非表示にした時点で、ロックされた作り方・解錠履歴はいずれも0件。
 */
// 型を boolean に固定しているのは、false 側だけが型検査される（＝ロック側のコードが腐る）
// のを防ぐため。リテラル型にすると分岐の片側が到達不能として扱われる。
export const LOCK_FEATURE_ENABLED: boolean = false

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
  if (!LOCK_FEATURE_ENABLED) return false
  if (!m.premium) return false
  if (!(m.locked_sections && m.locked_sections.length > 0)) return false
  if (unlockPassed(m)) return false
  return true
}

/**
 * その項目を伏せるか。ロック機能が非表示のときは常に false＝全部見せる。
 * 作り方ページ・combo ページなど、項目単位で出し分ける場所はここを通す。
 */
export function isSectionLocked(m: LockMix, section: string, entitled: boolean): boolean {
  if (!LOCK_FEATURE_ENABLED) return false
  if (entitled) return false
  return !!m.premium && (m.locked_sections ?? []).includes(section)
}

/** 完全公開のレシピか（ロックが効いていない）。 */
export function isFullyOpen(m: LockMix): boolean {
  return !isActivelyLocked(m)
}
