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
import { relativeTime, formatJaDate } from '@/lib/time'

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
