'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getReservations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reservations')
    .select('*, customer:customers(id, name, phone), assigned_staff:profiles(id, name)')
    .order('reservation_date', { ascending: false })
  return data || []
}

export async function getMyReservations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('reservations')
    .select('*, customer:customers(name, phone)')
    .eq('assigned_staff_id', user.id)
    .order('reservation_date', { ascending: true })
  return data || []
}

export async function updateStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from('reservations').update({ status }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath(`/admin/reservations/${id}`)
}

export async function updateReservationStatus(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  if (!id || !status) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ status }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath(`/admin/reservations/${id}`)
}

export async function assignStaff(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const staffId = (formData.get('staff_id') as string) || null
  if (!id) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ assigned_staff_id: staffId }).eq('id', id)
  revalidatePath(`/admin/reservations/${id}`)
}

export async function updateAdminNote(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const adminNote = (formData.get('admin_note') as string) || null
  if (!id) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ admin_note: adminNote }).eq('id', id)
  revalidatePath(`/admin/reservations/${id}`)
}

export async function getReservationById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reservations')
    .select('*, customer:customers(id, name, phone, contact_sns), assigned_staff:profiles(id, name), flavor:flavors(id, name)')
    .eq('id', id)
    .single()
  return data
}

export async function getStaffs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getActiveStaffs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, name, role, is_active')
    .eq('is_active', true)
    .order('name')
  return data || []
}

export async function updateStaff(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const role = formData.get('role') as string
  const availableAreas = formData.getAll('available_areas') as string[]
  const isActive = formData.get('is_active') === 'on'
  if (!id || !name || !role) return redirect('/admin/staff')
  await supabase
    .from('profiles')
    .update({
      name,
      phone,
      role,
      available_area: availableAreas.join(','),
      is_active: isActive,
    })
    .eq('id', id)
  revalidatePath('/admin/staff')
  return redirect('/admin/staff')
}

export async function deleteStaff(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/staff')
  await supabase.from('profiles').delete().eq('id', id)
  revalidatePath('/admin/staff')
  return redirect('/admin/staff')
}

export async function getCustomers(search?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('customers')
    .select('*, reservations:reservations(id)')
    .order('created_at', { ascending: false })
  if (search && search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }
  const { data } = await query
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    reservation_count: Array.isArray(c.reservations) ? (c.reservations as unknown[]).length : 0,
  }))
}

export async function getCustomerById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('customers').select('*').eq('id', id).single()
  return data
}

export async function getReservationsByCustomer(customerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reservations')
    .select('*')
    .eq('customer_id', customerId)
    .order('reservation_date', { ascending: false })
  return data || []
}

type ReservationFilters = {
  from?: string
  to?: string
  area?: string
  status?: string
}

export async function getFilteredReservations(filters: ReservationFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('reservations')
    .select('*, customer:customers(id, name, phone), assigned_staff:profiles(id, name)')
    .order('created_at', { ascending: false })
  if (filters.from) query = query.gte('reservation_date', filters.from)
  if (filters.to) query = query.lte('reservation_date', filters.to)
  if (filters.area) query = query.eq('area', filters.area)
  if (filters.status) query = query.eq('status', filters.status)
  const { data } = await query
  return data || []
}

// --- 予約可能かチェック ---
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

async function checkAvailability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  area: string,
  date: string,
  time: string
): Promise<{ ok: boolean; reason?: string }> {
  // Get max_units
  const { data: areaData } = await supabase
    .from('areas')
    .select('*')
    .eq('label', area)
    .single()

  const maxUnits = typeof areaData?.max_units === 'number' ? areaData.max_units : 0
  if (maxUnits === 0) {
    return { ok: false, reason: 'このエリアは現在準備中です' }
  }

  // Get reservations for this area + date
  const { data: reservations } = await supabase
    .from('reservations')
    .select('reservation_time')
    .eq('area', area)
    .eq('reservation_date', date)
    .not('status', 'in', '("cancelled","closed")')

  const times = (reservations || []).map((r: { reservation_time: string }) => r.reservation_time)

  // Check: same time slot at capacity?
  const countByTime: Record<string, number> = {}
  for (const t of times) {
    countByTime[t] = (countByTime[t] || 0) + 1
  }

  const requestedMins = timeToMinutes(time)

  // Check fully booked slots and ±20min buffer
  for (const [bookedTime, count] of Object.entries(countByTime)) {
    if (count >= maxUnits) {
      const bookedMins = timeToMinutes(bookedTime)
      if (Math.abs(requestedMins - bookedMins) <= 20) {
        return { ok: false, reason: 'この時間帯は予約が埋まっています' }
      }
    }
  }

  // Check daily limit + 6h cooldown
  if (times.length >= maxUnits) {
    const sortedTimes = [...times].sort()
    const triggerTime = sortedTimes[maxUnits - 1]
    const triggerMins = timeToMinutes(triggerTime)
    if (requestedMins >= triggerMins && requestedMins <= triggerMins + 360) {
      return { ok: false, reason: '1日の予約上限に達したため、しばらく予約できません' }
    }
  }

  return { ok: true }
}

export async function createReservation(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const name = (formData.get('customer_name') as string)?.trim()
  const phone = (formData.get('customer_phone') as string)?.trim()
  const reservationDate = formData.get('reservation_date') as string
  const reservationTime = formData.get('reservation_time') as string
  const area = formData.get('area') as string
  const location = (formData.get('location') as string)?.trim()
  const quantity = Number(formData.get('quantity')) || 1
  const flavorId = (formData.get('flavor_id') as string) || null
  const instagram = (formData.get('instagram') as string)?.trim() || ''
  const paymentMethod = (formData.get('payment_method') as string)?.trim() || ''
  const rawNotes = (formData.get('notes') as string)?.trim() || ''
  const notes = rawNotes || null

  if (!name || !phone || !reservationDate || !reservationTime || !area || !location) {
    return redirect('/reserve')
  }

  // サーバー側: 予約可能かチェック
  const availability = await checkAvailability(supabase, area, reservationDate, reservationTime)
  if (!availability.ok) {
    return redirect('/reserve')
  }

  // 顧客を作成または既存を検索
  let customerId: string
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .single()

  if (existing) {
    customerId = existing.id
    const updatePayload: Record<string, unknown> = { name }
    if (instagram) updatePayload.contact_sns = instagram
    await supabase.from('customers').update(updatePayload).eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ name, phone, area, contact_sns: instagram || null })
      .select('id')
      .single()
    if (customerError || !newCustomer) {
      return redirect('/reserve')
    }
    customerId = newCustomer.id
  }

  const { error: reservationError } = await supabase.from('reservations').insert({
    customer_id: customerId,
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    area,
    location,
    quantity,
    flavor_id: flavorId,
    payment_method: paymentMethod || null,
    admin_note: notes,
    status: 'received',
  })

  if (reservationError) {
    return redirect('/reserve')
  }

  // フレーバーの在庫を1減らす
  if (flavorId) {
    await supabase.rpc('decrement_flavor_stock', { flavor_id: flavorId })
  }

  return redirect('/reserve/complete')
}

export async function getAreas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('areas')
    .select('id, label')
    .eq('is_active', true)
    .order('created_at')
  return data || []
}

export async function getAreasWithUnits() {
  // cookiesに依存しないSupabase直接呼び出し（公開データのため認証不要）
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[getAreasWithUnits] env vars missing — URL:', !!url, 'KEY:', !!key)
    return []
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/areas?is_active=eq.true&order=created_at&select=*`,
      {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      console.error('[getAreasWithUnits] fetch error:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    return (data || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      label: a.label as string,
      max_units: typeof a.max_units === 'number' ? a.max_units : 0,
    }))
  } catch (e) {
    console.error('[getAreasWithUnits] exception:', e)
    return []
  }
}

export async function getFlavors() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return []

  try {
    const res = await fetch(
      `${url}/rest/v1/flavors?stock=gt.0&order=name&select=id,name,stock`,
      {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// --- Bars ---
export async function getBars() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bars')
    .select('*')
    .order('name')
  return data || []
}

export async function createBar(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const area = formData.get('area') as string
  if (!name || !address || !area) return redirect('/admin/bars')
  await supabase.from('bars').insert({ name, address, area })
  revalidatePath('/admin/bars')
  return redirect('/admin/bars')
}

export async function updateBar(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim()
  const area = formData.get('area') as string
  if (!id || !name || !address || !area) return redirect('/admin/bars')
  await supabase.from('bars').update({ name, address, area }).eq('id', id)
  revalidatePath('/admin/bars')
  return redirect('/admin/bars')
}

export async function deleteBar(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/bars')
  await supabase.from('bars').delete().eq('id', id)
  revalidatePath('/admin/bars')
  return redirect('/admin/bars')
}

// --- Flavors (admin) ---
export async function getAllFlavors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('flavors')
    .select('*')
    .order('name')
  return data || []
}

export async function createFlavor(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const name = (formData.get('name') as string)?.trim()
  const stock = Number(formData.get('stock')) || 0
  if (!name) return redirect('/admin/flavors')
  await supabase.from('flavors').insert({ name, stock })
  revalidatePath('/admin/flavors')
  return redirect('/admin/flavors')
}

export async function updateFlavor(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const stock = Number(formData.get('stock'))
  if (!id || !name || isNaN(stock)) return redirect('/admin/flavors')
  await supabase.from('flavors').update({ name, stock }).eq('id', id)
  revalidatePath('/admin/flavors')
  return redirect('/admin/flavors')
}

export async function deleteFlavor(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/flavors')
  await supabase.from('flavors').delete().eq('id', id)
  revalidatePath('/admin/flavors')
  return redirect('/admin/flavors')
}
