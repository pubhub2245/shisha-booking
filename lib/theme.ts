// 第一テーマ（今月の煙道検証）。
//
// 「テーマ」は combo（フレーバーの組み合わせ）を1つ指名しただけのもので、専用テーブルを持たない。
// 同一 combo に複数の作り方が並んで初めて比較が成立する、という煙道の中核をまず1点で成立させる。
// 詳細は docs/第一テーマ_設計再構成.md。
//
// テーマを差し替えるときはここだけ変える（実データの移行は不要）。

import { comboSlug } from '@/lib/combo'

export type Theme = {
  /** mixes.combo_key と完全一致する値 */
  comboKey: string
  brand: string
  flavor: string
  title: string
  /** 一行のリード。ランキングや優劣を匂わせない */
  lead: string
  /** なぜこのテーマなのか。ユーザーに見せる説明 */
  why: string[]
}

export const FIRST_THEME: Theme = {
  comboKey: 'al fakher|ダブルアップル',
  brand: 'AL FAKHER',
  flavor: 'ダブルアップル',
  title: 'AL FAKHER ダブルアップル 100%',
  lead: 'この一台の、最適解を探す。',
  why: [
    'フレーバーは1つに固定します。',
    'フレーバーが変わらなければ、残るのは「作り方」だけ。ボウル・詰め方・HMD・炭・火入れ。',
    '同じ葉から、どれだけ違う一台ができるのか。',
  ],
}

export const THEME_PATH = '/theme'

export function isThemeCombo(comboKey: string | null | undefined): boolean {
  return !!comboKey && comboKey === FIRST_THEME.comboKey
}

/** テーマ combo の /combo/[slug]。テーマページからの内部リンク用 */
export function themeComboSlug(): string {
  return comboSlug(FIRST_THEME.comboKey)
}
