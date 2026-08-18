// 作り方どうしの差分（M2「差分の名指し」）。
//
// 煙道が返すのは「おすすめの作り方」ではなく「あなたが作った一台と、ここが違う作り方」。
// 差分として名指しできる軸だけを比較に使う（docs/第一テーマ_ユーザージャーニー設計.md §4）。
//
// changeCost は「その軸を変えるのに買い物が要るか」。
// 炭の数・初期加熱・詰め方は今ある道具のままで変えられるが、HMD とボウルは買い直しになりうる。
// 2台目には必ず changeCost 0 の軸から出す。器材の所有情報を持たずに実行可能性を担保するための規則。

import { bowlLabel, packLabel, hmsLabel } from '@/lib/heat'

export type DiffAxisKey =
  | 'charcoal_count'
  | 'charcoal_size_mm'
  | 'steep_minutes'
  | 'pack_style'
  | 'hms_type'
  | 'bowl_type'

type MethodLike = {
  charcoal_count?: number | null
  charcoal_size_mm?: number | null
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
    // 「炭3個」だけでは熱量が決まらない。26mm と 22mm では与える熱が違う。
    // ただし他サイズの炭を買い直すことになるので、変更コストは器材と同じ扱いにする。
    key: 'charcoal_size_mm',
    label: '炭のサイズ',
    changeCost: 2,
    kind: 'number',
    value: (m) => num(m.charcoal_size_mm),
    format: (m) => (num(m.charcoal_size_mm) == null ? null : `${num(m.charcoal_size_mm)}mm`),
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

/** 両方に同じ値が入っている軸。「他は同じ」と言い切れる根拠になる */
export type SameAxis = { key: DiffAxisKey; label: string; value: string }

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

/**
 * 揃っている軸。両方に値があって一致するものだけ（片方が未記入なら「同じ」とは言えない）。
 *
 * 差分だけでは実験にならない。「他は同じ」が言えて初めて、
 * 出た差をその1軸のせいにできる。差分と対で扱うこと。
 */
export function sameAxes(base: MethodLike, target: MethodLike): SameAxis[] {
  const out: SameAxis[] = []
  for (const axis of DIFF_AXES) {
    const a = axis.value(base)
    const b = axis.value(target)
    if (a == null || b == null) continue
    if (a !== b) continue
    const v = axis.format(base)
    if (!v) continue
    out.push({ key: axis.key, label: axis.label, value: v })
  }
  return out
}

/** 差分・同条件・そもそも比べられない軸を一度に出す */
export type Comparison = {
  diffs: Diff[]
  sames: SameAxis[]
  /** どちらかが未記入で比較できない軸 */
  unknown: { key: DiffAxisKey; label: string }[]
}

export function compareMethods(base: MethodLike, target: MethodLike): Comparison {
  const diffs = diffMethods(base, target)
  const sames = sameAxes(base, target)
  const covered = new Set<DiffAxisKey>([...diffs.map((d) => d.key), ...sames.map((s) => s.key)])
  const unknown = DIFF_AXES.filter((a) => !covered.has(a.key)).map((a) => ({ key: a.key, label: a.label }))
  return { diffs, sames, unknown }
}

/**
 * 「この作り方を試すと何が分かるか」。
 *
 * おすすめではなく、実験としての意味を書く。1軸だけ違って他が揃っているときが最も強く、
 * 2軸違うときは「どちらが効いたかは切り分けられない」と正直に言う。
 * 言い切れないときは null を返す（曖昧な文言で埋めない）。
 */
export function explainExperiment(c: Comparison): string | null {
  if (c.diffs.length === 0) return null
  if (c.diffs.length === 1) {
    const d = c.diffs[0]
    const head = `${d.label}が ${d.from} → ${d.to}`
    if (c.sames.length >= 2) {
      return `${head}。ほかの${c.sames.length}項目は同じなので、${d.label}だけの差が見られます。`
    }
    if (c.sames.length === 1) {
      return `${head}。${c.sames[0].label}は同じ条件です。`
    }
    return `${head}。ほかの項目は記録が揃っていないため、差の理由は言い切れません。`
  }
  const names = c.diffs.map((d) => d.label).join('と')
  return `${names}の${c.diffs.length}つが違います。差が出ても、どちらが効いたかは切り分けられません。`
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
  if (d.key === 'charcoal_size_mm') {
    const from = Number(d.from.replace('mm', ''))
    const to = Number(d.to.replace('mm', ''))
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null
    return to < from ? '同じ個数でも熱量が下がります' : '同じ個数でも熱量が上がります'
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
  opts: {
    madeIds?: Set<string>
    makerCount?: (id: string) => number
    /** 直前の比較で差が出た軸。もう一度その軸を振ると、どこまで効くかが分かる */
    preferAxes?: DiffAxisKey[]
    /** 直前の比較で差が出なかった軸。同じ軸をもう一度変えても新しいことは分からない */
    avoidAxes?: DiffAxisKey[]
  } = {}
): NextCandidate<T>[] {
  const madeIds = opts.madeIds ?? new Set<string>()
  const makerCount = opts.makerCount ?? (() => 0)
  const prefer = new Set(opts.preferAxes ?? [])
  const avoid = new Set(opts.avoidAxes ?? [])

  // 差が出なかった軸「だけ」しか違わない候補は後ろへ（同じ実験の繰り返しになる）。
  // 1軸でも別の軸を含んでいれば、新しいことが分かるので下げない。
  const avoidRank = (c: NextCandidate<T>) =>
    avoid.size > 0 && c.diffs.every((d) => avoid.has(d.key)) ? 1 : 0
  const preferRank = (c: NextCandidate<T>) =>
    prefer.size > 0 && c.diffs.some((d) => prefer.has(d.key)) ? 0 : 1

  return candidates
    .filter((m) => m.id !== base.id)
    .map((method) => ({ method, diffs: diffMethods(base, method) }))
    .filter((c) => c.diffs.length >= 1 && c.diffs.length <= 2)
    .sort((a, b) => {
      const aMade = madeIds.has(a.method.id) ? 1 : 0
      const bMade = madeIds.has(b.method.id) ? 1 : 0
      if (aMade !== bMade) return aMade - bMade
      const aAvoid = avoidRank(a)
      const bAvoid = avoidRank(b)
      if (aAvoid !== bAvoid) return aAvoid - bAvoid
      const aPrefer = preferRank(a)
      const bPrefer = preferRank(b)
      if (aPrefer !== bPrefer) return aPrefer - bPrefer
      if (a.diffs.length !== b.diffs.length) return a.diffs.length - b.diffs.length
      const aCost = Math.max(...a.diffs.map((d) => d.changeCost))
      const bCost = Math.max(...b.diffs.map((d) => d.changeCost))
      if (aCost !== bCost) return aCost - bCost
      return makerCount(a.method.id) - makerCount(b.method.id)
    })
}

export type ComparisonAnswer = 'better' | 'same' | 'worse'

/**
 * 比較の答えから「次に何を変えるか」を決める。
 *
 * 煙道の目的は比較そのものではなく、比較から次の実験が生まれること。
 * 差が出たなら同じ軸をもっと振る（どこまで効くのか）、差が出なかったなら別の軸へ移る
 * （その軸はあなたには効かないと分かった＝これも結果）。
 *
 * changed は「今回の一台と、比較相手のあいだで違っていた軸」。
 * 差分が特定できないときは方針を出さない（言い切れないことを言わない）。
 */
export type ExperimentPolicy = {
  preferAxes: DiffAxisKey[]
  avoidAxes: DiffAxisKey[]
  /** 比較の結果として何が分かったか。次の候補の前に置く一文 */
  finding: string
  /** 次に何を変えるとよいか */
  suggestion: string
}

export function nextExperimentPolicy(answer: ComparisonAnswer, changed: Diff[]): ExperimentPolicy | null {
  if (changed.length === 0) return null
  const names = changed.map((d) => d.label).join('と')
  const keys = changed.map((d) => d.key)

  if (answer === 'same') {
    return {
      preferAxes: [],
      avoidAxes: keys,
      finding: `${names}を変えても、あなたには差が出ませんでした。これも結果です。`,
      suggestion: 'この軸はいったん置いて、別の軸を1つだけ変えてみると新しいことが分かります。',
    }
  }
  // 差が出た。どちらが良かったかは問わない——効く軸が見つかったことが収穫。
  return {
    preferAxes: keys,
    avoidAxes: [],
    finding:
      changed.length === 1
        ? `${names}の差は、あなたには効きました。`
        : `${names}のどちらかが効きました（2つ変えたので、まだ切り分けられません）。`,
    suggestion:
      changed.length === 1
        ? `次はもう一段${names}を振ってみると、どこまで効くのかが分かります。`
        : `次はどちらか片方だけを変えた作り方を試すと、原因を切り分けられます。`,
  }
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
