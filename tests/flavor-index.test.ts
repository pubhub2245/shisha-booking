import { describe, it, expect } from 'vitest'
import {
  buildFlavorIndex,
  flavorsOfType,
  publishableTypes,
  similarFlavors,
  publishableSimilarIds,
  MIN_ITEMS,
} from '@/lib/flavor-index'

const flavors = Array.from({ length: 8 }, (_, i) => ({ id: `f${i}`, brand: 'AL FAKHER', name: `味${i}` }))

/** f0〜f5 はミント、f0〜f2 はフルーツも付く。f6 はタグ無しの作り方、f7 は作り方そのものが無い */
const methods = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, taste_tags: ['ミント'], like_count: i, maker_count: i })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `mf${i}`, taste_tags: ['フルーツ'], like_count: 1, maker_count: 0 })),
  { id: 'mx', taste_tags: ['勝手に作った語'], like_count: 0, maker_count: 0 },
]
const links = [
  ...Array.from({ length: 6 }, (_, i) => ({ mix_id: `m${i}`, flavor_id: `f${i}` })),
  ...Array.from({ length: 3 }, (_, i) => ({ mix_id: `mf${i}`, flavor_id: `f${i}` })),
  { mix_id: 'mx', flavor_id: 'f6' },
]

describe('味の系統の索引', () => {
  const index = buildFlavorIndex(flavors, methods, links)

  it('系統は作り方に付いた言葉からだけ数える（名前から推測しない）', () => {
    expect(index.find((f) => f.id === 'f0')!.tags.sort()).toEqual(['フルーツ', 'ミント'])
    // 作り方が無いフレーバーには系統が付かない
    expect(index.find((f) => f.id === 'f7')!.tags).toEqual([])
  })

  it('マスタに無い自由入力の語は索引に入れない', () => {
    expect(index.find((f) => f.id === 'f6')!.tags).toEqual([])
    expect(index.find((f) => f.id === 'f6')!.methodCount).toBe(1)
  })

  it('実績（作った人数）の多い順に並ぶ', () => {
    const mint = flavorsOfType(index, 'ミント')
    expect(mint[0].id).toBe('f5')
    expect(mint.map((f) => f.id)).toEqual(['f5', 'f4', 'f3', 'f2', 'f1', 'f0'])
  })

  it('5件そろった系統だけページにする（薄いページを作らない）', () => {
    const types = publishableTypes(index)
    expect(types.map((t) => t.type)).toEqual(['ミント'])
    expect(flavorsOfType(index, 'フルーツ').length).toBeLessThan(MIN_ITEMS)
  })
})

describe('似た味', () => {
  const index = buildFlavorIndex(flavors, methods, links)

  it('系統が重なるフレーバーを、重なりの多い順に返す', () => {
    const sim = similarFlavors(index, 'f0')
    expect(sim[0].shared.sort()).toEqual(['フルーツ', 'ミント'])
    expect(sim.map((f) => f.id)).not.toContain('f0')
  })

  it('系統が1つも無いフレーバーには似た味を出さない', () => {
    expect(similarFlavors(index, 'f6')).toEqual([])
    expect(similarFlavors(index, 'f7')).toEqual([])
  })

  it('似た味が5件そろったフレーバーだけページにする', () => {
    const ids = publishableSimilarIds(index)
    // f0〜f5 はミント仲間が5件ずついる。f6・f7 は系統が無いので対象外
    expect(ids.sort()).toEqual(['f0', 'f1', 'f2', 'f3', 'f4', 'f5'])
  })
})
