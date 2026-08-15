import { tasteStage, tasteWords, canShowAverage } from '@/lib/taste'
import { describe, it, expect } from 'vitest'
import { flavorKey, comboKey, comboSlug, comboKeyFromSlug } from '@/lib/combo'
import { mixCompleteness, completenessLevel, mixQuality } from '@/lib/quality'
import { sectionLabel, normalizePrice, LOCKABLE_SECTIONS } from '@/lib/premium'
import {
  hmsOption,
  hmsLabel,
  charcoalLabel,
  bowlLabel,
  packLabel,
  windCoverLabel,
  heatEventMeta,
} from '@/lib/heat'
import { withAffiliateTag, AFFILIATE_TAG } from '@/lib/affiliate'
import { goHref } from '@/lib/go'
import { relativeTime, formatJaDate, jstMonthStartIso } from '@/lib/time'
import { buildNthMap, type ExperienceRow } from '@/lib/endo-log'

describe('combo', () => {
  it('flavorKey normalizes brand/name (trim + lowercase)', () => {
    expect(flavorKey(' AL FAKHER ', ' Grape ')).toBe('al fakher|grape')
    expect(flavorKey(null, 'Mint')).toBe('|mint')
  })

  it('comboKey is order- and duplicate-agnostic and sorted', () => {
    const a = comboKey([
      { brand: 'B', name: 'y' },
      { brand: 'A', name: 'x' },
    ])
    const b = comboKey([
      { brand: 'A', name: 'x' },
      { brand: 'B', name: 'y' },
      { brand: 'A', name: 'x' }, // duplicate
    ])
    expect(a).toBe('a|x + b|y')
    expect(a).toBe(b)
  })

  it('comboSlug round-trips through comboKeyFromSlug', () => {
    const key = comboKey([{ brand: 'AL FAKHER', name: 'グレープ' }, { brand: 'ADALYA', name: 'ミント' }])
    expect(comboKeyFromSlug(comboSlug(key))).toBe(key)
  })
})

describe('quality', () => {
  it('empty mix scores 0', () => {
    expect(mixCompleteness({})).toBe(0)
  })

  it('weights heat curve heavily', () => {
    const withCurve = mixCompleteness({ heat_curve: [{ t: 0, v: 10 }, { t: 5, v: 80 }] })
    expect(withCurve).toBeGreaterThanOrEqual(25)
  })

  it('caps at 100', () => {
    const score = mixCompleteness({
      description: 'x'.repeat(30),
      taste_tags: ['a'],
      strength: 'medium',
      heat_curve: [{ t: 0, v: 1 }, { t: 1, v: 2 }, { t: 2, v: 3 }],
      heat_events: [{ t: 1, type: 'add' }],
      heat_management: 'しっかり書いた補足メモです',
      placement_note: 'フレーバーの置き方メモ',
      hms_type: 'lotus',
      charcoal_type: 'cube',
      charcoal_count: 3,
      wind_cover: true,
      bowl_type: 'funnel',
      pack_style: 'fluff',
      mix_flavors: [{ ratio: 50 }, { ratio: 50 }],
    })
    expect(score).toBe(100)
  })

  it('completenessLevel thresholds', () => {
    expect(completenessLevel(60)).toBe('high')
    expect(completenessLevel(59)).toBe('medium')
    expect(completenessLevel(30)).toBe('medium')
    expect(completenessLevel(29)).toBe('low')
  })

  it('mixQuality = completeness*2 + min(likes,60)', () => {
    const base = { like_count: 100 } as Parameters<typeof mixQuality>[0]
    // completeness 0 → 0*2 + min(100,60) = 60
    expect(mixQuality(base)).toBe(60)
  })
})

describe('premium', () => {
  it('sectionLabel resolves known and falls back to input', () => {
    expect(sectionLabel('heat_curve')).toContain('熱管理カーブ')
    expect(sectionLabel('unknown')).toBe('unknown')
  })

  it('every lockable section has a label', () => {
    for (const s of LOCKABLE_SECTIONS) expect(sectionLabel(s.v)).toBe(s.l)
  })

  it('normalizePrice clamps and rejects invalid', () => {
    expect(normalizePrice('300')).toBe(300)
    expect(normalizePrice('50')).toBe(100) // min
    expect(normalizePrice('99999')).toBe(5000) // max
    expect(normalizePrice('250.7')).toBe(250) // floor
    expect(normalizePrice('abc')).toBeNull()
    expect(normalizePrice('0')).toBeNull()
    expect(normalizePrice(-5)).toBeNull()
  })
})

describe('heat', () => {
  it('hmsOption resolves and aliases kaloud → lotus', () => {
    expect(hmsOption('lotus')?.l).toBe('ロータス')
    expect(hmsOption('kaloud')?.v).toBe('lotus')
    expect(hmsOption('nope')).toBeNull()
    expect(hmsOption(null)).toBeNull()
  })

  it('label helpers', () => {
    expect(hmsLabel('kaloud')).toBe('ロータス')
    expect(hmsLabel(null)).toBeNull()
    expect(charcoalLabel('cube')).toBe('キューブ')
    expect(charcoalLabel('x')).toBeNull()
    expect(bowlLabel('funnel')).toBe('ファンネル')
    expect(packLabel('fluff')).toContain('ふんわり')
    expect(windCoverLabel(true)).toBe('被せる')
    expect(windCoverLabel(false)).toBe('被せない')
    expect(windCoverLabel(null)).toBeNull()
  })

  it('heatEventMeta falls back for unknown', () => {
    expect(heatEventMeta('add').icon).toBe('➕')
    expect(heatEventMeta('zzz').v).toBe('other')
  })
})

describe('affiliate', () => {
  it('null passes through', () => {
    expect(withAffiliateTag(null)).toBeNull()
  })
  it('amazon gets the associate tag', () => {
    const out = withAffiliateTag('https://www.amazon.co.jp/dp/B000')
    expect(out).toContain(`tag=${AFFILIATE_TAG}`)
  })
  it('amazon existing tag is overwritten', () => {
    const out = withAffiliateTag('https://www.amazon.co.jp/dp/B000?tag=someone-22')
    expect(out).toContain(`tag=${AFFILIATE_TAG}`)
    expect(out).not.toContain('someone-22')
  })
  it('non-amazon left as-is', () => {
    const url = 'https://item.rakuten.co.jp/x/'
    expect(withAffiliateTag(url)).toBe(url)
  })
  it('invalid url returned unchanged', () => {
    expect(withAffiliateTag('not a url')).toBe('not a url')
  })
})

describe('go', () => {
  it('null passes through', () => {
    expect(goHref(null)).toBeNull()
  })
  it('encodes target and adds meta', () => {
    const href = goHref('https://example.com/x?a=1', { f: 'fid', m: 'mid' })!
    expect(href.startsWith('/go?')).toBe(true)
    expect(href).toContain('f=fid')
    expect(href).toContain('m=mid')
    expect(decodeURIComponent(href.split('u=')[1].split('&')[0])).toBe('https://example.com/x?a=1')
  })
  it('omits empty meta', () => {
    const href = goHref('https://example.com', { f: null })!
    expect(href).not.toContain('f=')
  })
})

describe('time', () => {
  it('handles empty/invalid', () => {
    expect(relativeTime(null)).toBe('')
    expect(relativeTime('not-a-date')).toBe('')
  })
  it('formats recent times', () => {
    expect(relativeTime(new Date().toISOString())).toBe('たった今')
    expect(relativeTime(new Date(Date.now() - 2 * 60000).toISOString())).toBe('2分前')
    expect(relativeTime(new Date(Date.now() - 3 * 3600000).toISOString())).toBe('3時間前')
    expect(relativeTime(new Date(Date.now() - 2 * 86400000).toISOString())).toBe('2日前')
  })
  it('formatJaDate is JST-fixed and handles empty/invalid', () => {
    expect(formatJaDate(null)).toBe('')
    expect(formatJaDate('not-a-date')).toBe('')
    // UTC 22:00 は JST では翌日。timeZone 固定でズレないこと（UTC 実行環境でも同じ）。
    expect(formatJaDate('2026-08-13T22:00:00Z')).toBe('2026/8/14')
    expect(formatJaDate('2026-08-13T00:00:00Z')).toBe('2026/8/13')
  })
})

describe('jstMonthStartIso', () => {
  it('日本時間の月初 0:00 を UTC 15:00(前月末) として返す', () => {
    // 2026-08-01 09:00 JST = 2026-08-01T00:00:00Z
    expect(jstMonthStartIso(new Date('2026-08-15T00:00:00Z'))).toBe('2026-07-31T15:00:00.000Z')
  })
  it('JST月初直後(0:30)の記録が前月扱いにならない', () => {
    // JST 2026-08-01 00:30 = 2026-07-31T15:30:00Z
    const occurred = new Date('2026-07-31T15:30:00Z')
    const start = new Date(jstMonthStartIso(occurred))
    expect(occurred.getTime()).toBeGreaterThanOrEqual(start.getTime())
  })
  it('JST月末直前(23:30)はまだ当月に含まれる', () => {
    // JST 2026-08-31 23:30 = 2026-08-31T14:30:00Z
    const occurred = new Date('2026-08-31T14:30:00Z')
    expect(jstMonthStartIso(occurred)).toBe('2026-07-31T15:00:00.000Z')
  })
})

describe('combo_key（STEP 5：投稿の組み合わせ判定）', () => {
  it('フレーバーの順番を変えても同じ combo になる', () => {
    const a = comboKey([{ brand: 'Al Fakher', name: 'ミント' }, { brand: 'Adalya', name: 'マンゴー' }])
    const b = comboKey([{ brand: 'Adalya', name: 'マンゴー' }, { brand: 'Al Fakher', name: 'ミント' }])
    expect(a).toBe(b)
  })
  it('同じ種類の重複は1つとして扱う', () => {
    const a = comboKey([{ brand: 'Al Fakher', name: 'ミント' }, { brand: 'Al Fakher', name: 'ミント' }])
    expect(a).toBe(comboKey([{ brand: 'Al Fakher', name: 'ミント' }]))
  })
  it('フレーバーが違えば別の combo になる', () => {
    const a = comboKey([{ brand: 'Al Fakher', name: 'ミント' }])
    const b = comboKey([{ brand: 'Al Fakher', name: 'レモンミント' }])
    expect(a).not.toBe(b)
  })
  it('配合(量)は combo_key に影響しない＝同じ組み合わせの別の作り方になる', () => {
    // combo_key はフレーバー種類のみで決まる（比率は mix_flavors 側に持つ）
    const k = comboKey([{ brand: 'A', name: 'x' }, { brand: 'B', name: 'y' }])
    expect(k).toBe(comboKey([{ brand: 'B', name: 'y' }, { brand: 'A', name: 'x' }]))
  })
})

describe('味覚5軸（STEP 6）', () => {
  const mk = (over: Partial<Record<string, { avg: number | null; count: number }>>, raters: number) => ({
    sweetness: { avg: null, count: 0 },
    coolness: { avg: null, count: 0 },
    sourness: { avg: null, count: 0 },
    richness: { avg: null, count: 0 },
    heaviness: { avg: null, count: 0 },
    ...over,
    raterCount: raters,
  }) as never

  it('評価0人は表示しない', () => {
    expect(tasteStage(mk({}, 0))).toBe('none')
  })
  it('1〜2人はデータ収集中（平均を断定しない）', () => {
    expect(tasteStage(mk({ sweetness: { avg: 4.8, count: 1 } }, 1))).toBe('collecting')
    expect(tasteStage(mk({ sweetness: { avg: 4.8, count: 2 } }, 2))).toBe('collecting')
  })
  it('3人以上で平均表示が可能になる', () => {
    const s = mk({ sweetness: { avg: 4.2, count: 3 } }, 3)
    expect(tasteStage(s)).toBe('ready')
    expect(canShowAverage(s)).toBe(true)
  })
  it('母数が少ないうちは自然言語タグを出さない', () => {
    expect(tasteWords(mk({ sweetness: { avg: 5, count: 1 } }, 1))).toEqual([])
  })
  it('平均から初心者向けの言葉を導く（甘め・爽快・軽め）', () => {
    const s = mk(
      {
        sweetness: { avg: 4.2, count: 5 },
        coolness: { avg: 4.5, count: 4 },
        heaviness: { avg: 1.8, count: 3 },
      },
      5
    )
    expect(tasteWords(s)).toEqual(['甘め', '爽快', '軽め'])
  })
  it('未評価の軸は言葉に含めない', () => {
    const s = mk({ sweetness: { avg: 4.5, count: 3 } }, 3)
    expect(tasteWords(s)).toEqual(['甘め'])
  })
})

describe('煙道帳のN回目（種別ごとに通算）', () => {
  const rows: ExperienceRow[] = [
    { id: 's1', mix_id: 'A', experience_type: 'smoked', occurred_at: '2026-08-01T00:00:00Z' },
    { id: 'm1', mix_id: 'A', experience_type: 'made', occurred_at: '2026-08-02T00:00:00Z' },
    { id: 's2', mix_id: 'A', experience_type: 'smoked', occurred_at: '2026-08-03T00:00:00Z' },
  ]

  it('smokedはsmokedのみ、madeはmadeのみで数える', () => {
    const nth = buildNthMap(rows)
    expect(nth.get('s1')).toBe(1)
    expect(nth.get('s2')).toBe(2) // 間に made が挟まっても「吸った 2回目」
    expect(nth.get('m1')).toBe(1) // made は「作った 1回目」
  })

  it('mixが違えば別カウント', () => {
    const nth = buildNthMap([
      ...rows,
      { id: 's3', mix_id: 'B', experience_type: 'smoked', occurred_at: '2026-08-04T00:00:00Z' },
    ])
    expect(nth.get('s3')).toBe(1)
  })

  it('occurred_atが同時刻でも順序が安定する', () => {
    const same: ExperienceRow[] = [
      { id: 'b', mix_id: 'A', experience_type: 'smoked', occurred_at: '2026-08-01T00:00:00Z' },
      { id: 'a', mix_id: 'A', experience_type: 'smoked', occurred_at: '2026-08-01T00:00:00Z' },
    ]
    const nth = buildNthMap(same)
    expect(nth.get('a')).toBe(1)
    expect(nth.get('b')).toBe(2)
  })
})
