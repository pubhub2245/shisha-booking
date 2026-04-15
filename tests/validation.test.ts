import { describe, it, expect } from 'vitest'
import { reservationSchema, cancelSchema, normalizePhone } from '@/lib/validation/reservation'

describe('normalizePhone', () => {
  it('strips hyphens, spaces, fullwidth characters', () => {
    expect(normalizePhone('090-1234-5678')).toBe('09012345678')
    expect(normalizePhone('090 1234 5678')).toBe('09012345678')
    expect(normalizePhone('０９０－１２３４－５６７８')).toBe('０９０１２３４５６７８') // 全角数字はそのまま (UI 側で半角化推奨)
    expect(normalizePhone('(090)1234-5678')).toBe('09012345678')
  })
})

describe('reservationSchema', () => {
  const valid = {
    customer_name: '山田太郎',
    customer_name_kana: 'やまだたろう',
    customer_phone: '090-1234-5678',
    reservation_date: '2026-05-01',
    reservation_time: '14:30',
    area: '宮崎市内（西橘周辺）',
    location: '宮崎市西橘1-2-3',
    quantity: 2,
    flavor_id: '',
    instagram: '',
    payment_method: '現金',
    notes: '',
  }

  it('accepts valid input and normalizes phone', () => {
    const r = reservationSchema.parse(valid)
    expect(r.customer_phone).toBe('09012345678')
    expect(r.quantity).toBe(2)
    expect(r.flavor_id).toBeNull()
  })

  it('rejects missing name', () => {
    const r = reservationSchema.safeParse({ ...valid, customer_name: '' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid phone', () => {
    const r = reservationSchema.safeParse({ ...valid, customer_phone: '12345' })
    expect(r.success).toBe(false)
  })

  it('rejects bad time format', () => {
    const r = reservationSchema.safeParse({ ...valid, reservation_time: '25:00' })
    expect(r.success).toBe(false)
  })

  it('coerces quantity from string', () => {
    const r = reservationSchema.parse({ ...valid, quantity: '3' as unknown as number })
    expect(r.quantity).toBe(3)
  })

  it('clamps quantity', () => {
    const r = reservationSchema.safeParse({ ...valid, quantity: 99 })
    expect(r.success).toBe(false)
  })
})

describe('cancelSchema', () => {
  it('rejects non-uuid id', () => {
    const r = cancelSchema.safeParse({ id: 'abc', phone: '09012345678' })
    expect(r.success).toBe(false)
  })

  it('accepts valid', () => {
    const r = cancelSchema.parse({
      id: '11111111-2222-4333-8444-555555555555',
      phone: '090-1234-5678',
    })
    expect(r.phone).toBe('09012345678')
  })
})
