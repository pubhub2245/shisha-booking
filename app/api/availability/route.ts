import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/availability?area=XXX&date=YYYY-MM-DD
 *
 * Returns { blocked: string[], booked: string[] }
 *  - blocked: time slots that cannot be selected (±20min buffer or 6h cooldown)
 *  - booked:  time slots that are fully booked (shown as "予約済み")
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area = searchParams.get('area') || ''
  const date = searchParams.get('date') || ''

  if (!area || !date) {
    return NextResponse.json({ blocked: [], booked: [] })
  }

  const supabase = await createClient()

  // Get max_units for this area
  const { data: areaData, error: areaError } = await supabase
    .from('areas')
    .select('*')
    .eq('label', area)
    .single()

  if (areaError) {
    console.error('[availability] area query error:', areaError.message)
  }
  const maxUnits = typeof areaData?.max_units === 'number' ? areaData.max_units : 0

  if (maxUnits === 0) {
    // All slots blocked for this area
    return NextResponse.json({ blocked: getAllSlots(), booked: [] })
  }

  // Get all reservations for this area + date
  const { data: reservations } = await supabase
    .from('reservations')
    .select('reservation_time')
    .eq('area', area)
    .eq('reservation_date', date)
    .not('status', 'in', '("cancelled","closed")')

  const times = (reservations || []).map((r: { reservation_time: string }) => r.reservation_time)

  // Count reservations per time slot
  const countByTime: Record<string, number> = {}
  for (const t of times) {
    countByTime[t] = (countByTime[t] || 0) + 1
  }

  const booked: string[] = []  // slots at max capacity
  const blocked = new Set<string>()

  // Find fully booked slots and their ±20min buffer
  for (const [time, count] of Object.entries(countByTime)) {
    if (count >= maxUnits) {
      booked.push(time)
      // Block ±20 minutes around this slot
      const mins = timeToMinutes(time)
      for (let m = mins - 20; m <= mins + 20; m += 10) {
        if (m >= 600 && m <= 1320) { // 10:00-22:00
          blocked.add(minutesToTime(m))
        }
      }
    }
  }

  // Rule 5: If daily total >= maxUnits, block 6 hours from the last reservation
  const totalDaily = times.length
  if (totalDaily >= maxUnits) {
    // Find the time of the reservation that hit the limit
    // Sort times and get the maxUnits-th one
    const sortedTimes = [...times].sort()
    const triggerTime = sortedTimes[maxUnits - 1]
    const triggerMins = timeToMinutes(triggerTime)
    // Block 6 hours (360 minutes) after the trigger
    for (let m = triggerMins; m <= triggerMins + 360 && m <= 1320; m += 10) {
      blocked.add(minutesToTime(m))
    }
  }

  return NextResponse.json({
    blocked: Array.from(blocked),
    booked,
  })
}

function getAllSlots(): string[] {
  const slots: string[] = []
  for (let m = 600; m <= 1320; m += 10) { // 10:00 to 22:00
    slots.push(minutesToTime(m))
  }
  return slots
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
