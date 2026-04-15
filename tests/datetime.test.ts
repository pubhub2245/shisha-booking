import { describe, it, expect, vi, afterEach } from 'vitest'
import { jstTodayStr, jstNowMinutes, reservationDateTimeInJst } from '@/lib/utils/datetime'

afterEach(() => {
  vi.useRealTimers()
})

describe('JST utilities', () => {
  it('jstTodayStr returns JST date even when running in UTC', () => {
    // 2026-04-16 22:00 UTC = 2026-04-17 07:00 JST
    vi.useFakeTimers().setSystemTime(new Date('2026-04-16T22:00:00Z'))
    expect(jstTodayStr()).toBe('2026-04-17')
  })

  it('jstNowMinutes reflects JST hour', () => {
    // 2026-04-16 00:30 UTC = 2026-04-16 09:30 JST → 9*60+30 = 570
    vi.useFakeTimers().setSystemTime(new Date('2026-04-16T00:30:00Z'))
    expect(jstNowMinutes()).toBe(570)
  })

  it('reservationDateTimeInJst converts JST wall-clock to correct UTC', () => {
    // JST 2026-05-01 14:00 → UTC 2026-05-01 05:00
    const d = reservationDateTimeInJst('2026-05-01', '14:00')
    expect(d.toISOString()).toBe('2026-05-01T05:00:00.000Z')
  })
})
