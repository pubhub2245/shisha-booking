'use client'

import { track } from '@vercel/analytics'

/**
 * 煙道のカスタムイベント（クライアント側）。
 *
 * ■ PII を送らないこと（最重要）
 * ここへ渡してよいのは「ID」「列挙値」「件数」だけ。
 * email / display_name / username / bio / note / comment / taste の自由記述・
 * support 問い合わせ本文などは絶対に渡さない。値そのものではなく件数や区分へ変換する。
 * ユーザー識別を目的とした user_id も送らない（誰が、ではなく何が起きたかだけ測る）。
 *
 * ■ 型で縛る
 * イベント名とプロパティの組み合わせをタプルの union で定義しているので、
 * 定義外のイベント名・プロパティはコンパイルエラーになる。
 */
export type Verdict = 'again' | 'good' | 'ok' | 'not_for_me'

export type EndoEvent =
  /** mix 詳細の閲覧 */
  | ['mix_view', { mix_id: string; combo_key: string }]
  /** bookmark の INSERT 成功 */
  | ['save', { mix_id: string }]
  /** bookmark の解除成功 */
  | ['unsave', { mix_id: string }]
  /** experience_type='smoked' の INSERT 成功。nth は そのユーザー×mix の smoked 通算 */
  | ['smoked', { mix_id: string; nth: number }]
  /** experience_type='made' の INSERT 成功。nth は そのユーザー×mix の made 通算 */
  | ['made', { mix_id: string; nth: number }]
  /** verdict の保存成功 */
  | ['verdict_set', { mix_id: string; verdict: Verdict }]
  /** 味覚評価の保存成功。axes は入力された軸数(1〜5)。実値は送らない */
  | ['taste_submitted', { mix_id: string; axes: number }]
  /** 直接比較の保存成功。比較相手の mix_id は送らない（何が起きたかだけ測る） */
  | ['comparison_set', { mix_id: string; comparison: 'better' | 'same' | 'worse'; axes: number }]

/** イベントを1件送る。計測は best-effort（失敗してもユーザー操作は止めない）。 */
export function trackEvent(...event: EndoEvent): void {
  const [name, props] = event
  try {
    track(name, props)
  } catch {
    // 計測失敗は無視する
  }
}

/**
 * 同じキーでは1回しか送らない版。
 * 戻る/進む・タブ復帰などで同じ画面が再マウントされたときの重複計測を抑える
 * （ページを開き直した＝新しい JS セッションになれば、また1回送られる）。
 */
const sentOnce = new Set<string>()

export function trackEventOnce(key: string, ...event: EndoEvent): void {
  if (sentOnce.has(key)) return
  sentOnce.add(key)
  trackEvent(...event)
}
