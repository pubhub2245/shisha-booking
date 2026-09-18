/**
 * 味の系統別まとめ／似た味の一覧を作るための索引。
 *
 * 煙道の扱う単位は「1つのフレーバーを、どう作るか」なので、フレーバー自身は
 * 系統（フルーツ・ミント等）の情報を持っていない。系統は、そのフレーバーに
 * 付いた作り方（mixes.taste_tags）＝実際に人が付けた値からしか分からない。
 * したがってここでは **実データのある組み合わせだけ** を索引にする。
 *
 * 推測でフレーバー名から系統を当てない（「アイスアクア」を勝手にミントにしない）。
 * 名前からの推測は、実データが増えるまで誰も検算できない嘘になるため。
 */

import { TYPE_TAGS } from '@/lib/tags'

/** 薄いページを作らないための下限。これ未満の組み合わせはページにしない。 */
export const MIN_ITEMS = 5

/** 索引に載せる系統（味わいタグの中の「系統」側だけ。甘い・濃厚などの強度は使わない） */
export const TASTE_TYPES: readonly string[] = TYPE_TAGS

export type FlavorRef = {
  id: string
  brand: string
  name: string
}

/** 索引の1件＝フレーバー＋そのフレーバーに実際に付いている系統と実績 */
export type IndexedFlavor = FlavorRef & {
  /** そのフレーバーの作り方に付いた系統タグ（実データのみ） */
  tags: string[]
  /** 作り方の数 */
  methodCount: number
  /** 作り方に付いた「いいね」の合計 */
  likeCount: number
  /** 作った人数の合計（再現の実績） */
  makerCount: number
}

export type MethodRow = {
  id: string
  taste_tags: string[] | null
  like_count: number | null
  /** 作った人数（mix_made_counts 由来）。無ければ 0 として扱う */
  maker_count?: number | null
}

/** mix_id → flavor の対応（mix_flavors 由来） */
export type MethodFlavorLink = {
  mix_id: string
  flavor_id: string
}

/**
 * フレーバーごとに「系統タグ・作り方の数・いいね・作った人数」を集める。
 * 系統タグは TASTE_TYPES に載っている語だけを採る（自由入力の揺れを索引に入れない）。
 */
export function buildFlavorIndex(
  flavors: FlavorRef[],
  methods: MethodRow[],
  links: MethodFlavorLink[],
): IndexedFlavor[] {
  const methodById = new Map(methods.map((m) => [m.id, m]))
  const acc = new Map<string, { tags: Map<string, number>; methodCount: number; likeCount: number; makerCount: number }>()

  for (const link of links) {
    const m = methodById.get(link.mix_id)
    if (!m) continue
    let cur = acc.get(link.flavor_id)
    if (!cur) {
      cur = { tags: new Map(), methodCount: 0, likeCount: 0, makerCount: 0 }
      acc.set(link.flavor_id, cur)
    }
    cur.methodCount += 1
    cur.likeCount += m.like_count ?? 0
    cur.makerCount += m.maker_count ?? 0
    for (const t of m.taste_tags ?? []) {
      if (!TASTE_TYPES.includes(t)) continue
      cur.tags.set(t, (cur.tags.get(t) ?? 0) + 1)
    }
  }

  return flavors.map((f) => {
    const cur = acc.get(f.id)
    const tags = cur
      ? [...cur.tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja')).map(([t]) => t)
      : []
    return {
      ...f,
      tags,
      methodCount: cur?.methodCount ?? 0,
      likeCount: cur?.likeCount ?? 0,
      makerCount: cur?.makerCount ?? 0,
    }
  })
}

/** 実績の多い順（作った人数 → いいね → 作り方の数 → 名前） */
export function byTrackRecord(a: IndexedFlavor, b: IndexedFlavor): number {
  return (
    b.makerCount - a.makerCount ||
    b.likeCount - a.likeCount ||
    b.methodCount - a.methodCount ||
    `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, 'ja')
  )
}

/** ある系統に属するフレーバー（実データのあるものだけ・実績順） */
export function flavorsOfType(index: IndexedFlavor[], type: string): IndexedFlavor[] {
  return index.filter((f) => f.tags.includes(type)).sort(byTrackRecord)
}

/** ページを作ってよい系統（MIN_ITEMS 件以上そろったものだけ） */
export function publishableTypes(index: IndexedFlavor[]): { type: string; count: number }[] {
  return TASTE_TYPES.map((type) => ({ type, count: flavorsOfType(index, type).length }))
    .filter((t) => t.count >= MIN_ITEMS)
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type, 'ja'))
}

export type SimilarFlavor = IndexedFlavor & {
  /** 一致した系統 */
  shared: string[]
}

/**
 * 「〇〇に似た味」＝同じ系統タグを共有しているフレーバー。
 * 共有が多い順、同数なら実績順。自分自身は除く。
 * 元のフレーバーに系統タグが1つも無ければ（＝実データが無ければ）何も返さない。
 */
export function similarFlavors(index: IndexedFlavor[], flavorId: string): SimilarFlavor[] {
  const base = index.find((f) => f.id === flavorId)
  if (!base || base.tags.length === 0) return []
  const baseTags = new Set(base.tags)
  return index
    .filter((f) => f.id !== flavorId)
    .map((f) => ({ ...f, shared: f.tags.filter((t) => baseTags.has(t)) }))
    .filter((f) => f.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length || byTrackRecord(a, b))
}

/** 「似た味」ページを作ってよいフレーバー（MIN_ITEMS 件以上そろったものだけ） */
export function publishableSimilarIds(index: IndexedFlavor[]): string[] {
  return index.filter((f) => similarFlavors(index, f.id).length >= MIN_ITEMS).map((f) => f.id)
}
