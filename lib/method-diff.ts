// 作り方どうしの差分（M2「差分の名指し」）。
//
// 煙道が返すのは「おすすめの作り方」ではなく「あなたが作った一台と、ここが違う作り方」。
// 差分として名指しできる軸だけを比較に使う（docs/第一テーマ_ユーザージャーニー設計.md §4）。
//
// changeCost は「その軸を変えるのに買い物が要るか」。
// 炭の数・初期加熱・詰め方は今ある道具のままで変えられるが、HMD とボウルは買い直しになりうる。
// 2台目には必ず changeCost 0 の軸から出す。器材の所有情報を持たずに実行可能性を担保するための規則。

import { bowlLabel, packLabel, hmsLabel } from '@/lib/heat'

export type DiffAxisKey = 'charcoal_count' | 'steep_minutes' | 'pack_style' | 'hms_type' | 'bowl_type'

type MethodLike = {
  charcoal_count?: number | null
  steep_minutes?: number | string | null
  pack_style?: string | null
  hms_type?: string | null
  bowl_type?: string | null
}

type AxisDef = {
  key: DiffAxisKey
  label: string
  /** 0＝今ある道具のまま変えられる。2＝器材の買い直しになりうる */
  changeCost: 0 | 2
  kind: 'number' | 'choice'
  format: (m: MethodLike) => string | null
  value: (m: MethodLike) => number | string | null
}

function num(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export const DIFF_AXES: readonly AxisDef[] = [
  {
    key: 'charcoal_count',
    // 炭は途中で足し引きするので通しの本数は比較できない。立ち上げ時点だけが揃った条件になる。
    label: '立ち上げの炭',
    changeCost: 0,
    kind: 'number',
    value: (m) => num(m.charcoal_count),
    format: (m) => (num(m.charcoal_count) == null ? null : `${num(m.charcoal_count)}個`),
  },
  {
    key: 'steep_minutes',
    label: '初期加熱',
    changeCost: 0,
    kind: 'number',
    value: (m) => num(m.steep_minutes),
    format: (m) => (num(m.steep_minutes) == null ? null : `${num(m.steep_minutes)}分`),
  },
  {
    key: 'pack_style',
    label: '詰め方',
    changeCost: 0,
    kind: 'choice',
    value: (m) => m.pack_style ?? null,
    format: (m) => packLabel(m.pack_style),
  },
  {
    key: 'hms_type',
    label: 'HMD',
    changeCost: 2,
    kind: 'choice',
    value: (m) => m.hms_type ?? null,
    format: (m) => hmsLabel(m.hms_type),
  },
  {
    key: 'bowl_type',
    label: 'ボウル',
    changeCost: 2,
    kind: 'choice',
    value: (m) => m.bowl_type ?? null,
    format: (m) => bowlLabel(m.bowl_type),
  },
]

export type Diff = {
  key: DiffAxisKey
  label: string
  changeCost: 0 | 2
  from: string
  to: string
}

/**
 * base から target への差分。両方に値が入っている軸だけを見る
 * （片方が未記入の軸は「違う」と言い切れないので差分にしない）。
 */
export function diffMethods(base: MethodLike, target: MethodLike): Diff[] {
  const out: Diff[] = []
  for (const axis of DIFF_AXES) {
    const a = axis.value(base)
    const b = axis.value(target)
    if (a == null || b == null) continue
    if (a === b) continue
    const from = axis.format(base)
    const to = axis.format(target)
    if (!from || !to) continue
    out.push({ key: axis.key, label: axis.label, changeCost: axis.changeCost, from, to })
  }
  return out
}

/** 「炭の数 3個 → 2個」 */
export function describeDiff(d: Diff): string {
  return `${d.label} ${d.from} → ${d.to}`
}

/** 「炭の数と詰め方が違います」／差分なしなら null */
export function summarizeDiffs(diffs: Diff[]): string | null {
  if (diffs.length === 0) return null
  return `${diffs.map((d) => d.label).join('と')}が違います`
}

/** 変化の意味づけ。数値ではなく「何が起きるか」を書く（設計再構成 §9） */
export function diffMeaning(d: Diff): string | null {
  if (d.key === 'charcoal_count') {
    const from = Number(d.from.replace('個', ''))
    const to = Number(d.to.replace('個', ''))
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null
    return to < from ? '熱量が下がります' : '熱量が上がります'
  }
  if (d.key === 'steep_minutes') {
    const from = Number(d.from.replace('分', ''))
    const to = Number(d.to.replace('分', ''))
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null
    return to > from ? '立ち上がりに時間をかけます' : '早めに吸い始めます'
  }
  return null
}

export type NextCandidate<T> = { method: T; diffs: Diff[] }

/**
 * 「次の1台」の候補を並べる。自動推薦アルゴリズムではなく、人間が読める規則をそのまま書いたもの。
 *
 *   1. 差分が1軸だけのものを最優先（原因が特定できる＝学びが発生する）
 *   2. その軸の変更コストが低いものを優先（炭の数・初期加熱・詰め方）
 *   3. まだ作っていないものを優先
 *   4. 作った人が少ないものを優先（データの穴を埋める。文面には出さない）
 *
 * 差分が0軸（＝比べても意味がない）と、3軸以上（＝何が効いたか分からない）は候補から外す。
 */
export function rankNextCandidates<T extends MethodLike & { id: string }>(
  base: MethodLike & { id: string },
  candidates: T[],
  opts: { madeIds?: Set<string>; makerCount?: (id: string) => number } = {}
): NextCandidate<T>[] {
  const madeIds = opts.madeIds ?? new Set<string>()
  const makerCount = opts.makerCount ?? (() => 0)

  return candidates
    .filter((m) => m.id !== base.id)
    .map((method) => ({ method, diffs: diffMethods(base, method) }))
    .filter((c) => c.diffs.length >= 1 && c.diffs.length <= 2)
    .sort((a, b) => {
      const aMade = madeIds.has(a.method.id) ? 1 : 0
      const bMade = madeIds.has(b.method.id) ? 1 : 0
      if (aMade !== bMade) return aMade - bMade
      if (a.diffs.length !== b.diffs.length) return a.diffs.length - b.diffs.length
      const aCost = Math.max(...a.diffs.map((d) => d.changeCost))
      const bCost = Math.max(...b.diffs.map((d) => d.changeCost))
      if (aCost !== bCost) return aCost - bCost
      return makerCount(a.method.id) - makerCount(b.method.id)
    })
}

/**
 * 設計空間の地図。テーマの作り方全体が、軸ごとにどこからどこまで散らばっているか。
 * 他人の体験データを1件も必要としないので、参加者が0人でも成立する（設計再構成 §3）。
 */
export type MapAxis =
  | { key: DiffAxisKey; label: string; kind: 'number'; min: number; max: number; mine: number | null }
  | { key: DiffAxisKey; label: string; kind: 'choice'; values: { value: string; label: string; count: number }[]; mine: string | null }

export function buildDesignSpace(methods: MethodLike[], mine?: MethodLike | null): MapAxis[] {
  const out: MapAxis[] = []
  for (const axis of DIFF_AXES) {
    if (axis.kind === 'number') {
      const nums = methods.map((m) => axis.value(m)).filter((v): v is number => typeof v === 'number')
      if (nums.length < 2) continue
      const min = Math.min(...nums)
      const max = Math.max(...nums)
      if (min === max) continue
      const mineV = mine ? axis.value(mine) : null
      out.push({ key: axis.key, label: axis.label, kind: 'number', min, max, mine: typeof mineV === 'number' ? mineV : null })
    } else {
      const counts = new Map<string, number>()
      for (const m of methods) {
        const v = axis.value(m)
        if (typeof v !== 'string' || !v) continue
        counts.set(v, (counts.get(v) ?? 0) + 1)
      }
      if (counts.size < 2) continue
      const values = [...counts.entries()]
        .map(([value, count]) => ({ value, count, label: axis.format({ [axis.key]: value } as MethodLike) ?? value }))
        .sort((a, b) => b.count - a.count)
      const mineV = mine ? axis.value(mine) : null
      out.push({ key: axis.key, label: axis.label, kind: 'choice', values, mine: typeof mineV === 'string' ? mineV : null })
    }
  }
  return out
}

/** 地図が「潰れていないか」。全件が同じ値なら比較そのものが成立しない（設計再構成 §14-3） */
export function designSpaceIsFlat(methods: MethodLike[]): boolean {
  return buildDesignSpace(methods).length === 0
}
