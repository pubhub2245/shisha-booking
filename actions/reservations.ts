'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { reservationSchema, cancelSchema, normalizePhone } from '@/lib/validation/reservation'
import type { ReservationStatus } from '@/lib/types/database'
import { createPublicClient } from '@/lib/supabase/public'
import { audit } from '@/lib/audit'
import { reportError } from '@/lib/error-report'
import {
  notifyAdmin,
  reservationCreatedMessage,
  reservationCancelledMessage,
} from '@/lib/notifications'

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
  await audit('reservation.update_status', { type: 'reservation', id }, { status })
  revalidatePath('/admin')
  revalidatePath(`/admin/reservations/${id}`)
}

export async function updateReservationStatus(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  if (!id || !status) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ status }).eq('id', id)
  await audit('reservation.update_status', { type: 'reservation', id }, { status })
  revalidatePath('/admin')
  revalidatePath(`/admin/reservations/${id}`)
}

export async function assignStaff(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const staffId = (formData.get('staff_id') as string) || null
  if (!id) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ assigned_staff_id: staffId }).eq('id', id)
  await audit('reservation.assign_staff', { type: 'reservation', id }, { staff_id: staffId })
  revalidatePath(`/admin/reservations/${id}`)
}

export async function updateAdminNote(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  const adminNote = (formData.get('admin_note') as string) || null
  if (!id) return
  const supabase = await createClient()
  await supabase.from('reservations').update({ admin_note: adminNote }).eq('id', id)
  await audit('reservation.update_admin_note', { type: 'reservation', id })
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
  await audit('staff.update', { type: 'profile', id }, { role, is_active: isActive })
  revalidatePath('/admin/staff')
  return redirect('/admin/staff')
}

export async function deleteStaff(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/staff')
  await supabase.from('profiles').delete().eq('id', id)
  await audit('staff.delete', { type: 'profile', id })
  revalidatePath('/admin/staff')
  return redirect('/admin/staff')
}

export async function getCustomers(
  search?: string,
  pagination: { page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient()
  const page = Math.max(1, pagination.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, pagination.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('customers')
    .select('*, reservations:reservations(id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (search && search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }
  const { data, count } = await query
  const rows = (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    reservation_count: Array.isArray(c.reservations) ? (c.reservations as unknown[]).length : 0,
  }))
  return { rows, total: count ?? 0, page, pageSize }
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

export async function getFilteredReservations(
  filters: ReservationFilters = {},
  pagination: { page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient()
  const page = Math.max(1, pagination.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, pagination.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reservations')
    .select('*, customer:customers(id, name, phone), assigned_staff:profiles(id, name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (filters.from) query = query.gte('reservation_date', filters.from)
  if (filters.to) query = query.lte('reservation_date', filters.to)
  if (filters.area) query = query.eq('area', filters.area)
  if (filters.status) query = query.eq('status', filters.status as ReservationStatus)
  const { data, count } = await query
  return { rows: data || [], total: count ?? 0, page, pageSize }
}

export type ReservationFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function createReservation(
  _prev: ReservationFormState | null,
  formData: FormData
): Promise<ReservationFormState> {
  // 1. Zod でバリデーション
  const parsed = reservationSchema.safeParse({
    customer_name: formData.get('customer_name'),
    customer_name_kana: formData.get('customer_name_kana'),
    customer_phone: formData.get('customer_phone'),
    reservation_date: formData.get('reservation_date'),
    reservation_time: formData.get('reservation_time'),
    area: formData.get('area'),
    location: formData.get('location'),
    quantity: formData.get('quantity'),
    flavor_id: formData.get('flavor_id'),
    instagram: formData.get('instagram'),
    payment_method: formData.get('payment_method'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, error: '入力内容をご確認ください', fieldErrors }
  }

  const v = parsed.data
  const supabase = await createClient()

  // 2. アトミック RPC に委譲 (二重予約 / 在庫競合をDB側で防止)
  const { data, error } = await supabase.rpc('create_reservation_atomic', {
    p_name: v.customer_name,
    p_name_kana: v.customer_name_kana ?? null,
    p_phone: v.customer_phone,
    p_area: v.area,
    p_reservation_date: v.reservation_date,
    p_reservation_time: v.reservation_time,
    p_location: v.location,
    p_quantity: v.quantity,
    p_flavor_id: v.flavor_id ?? null,
    p_instagram: v.instagram ?? null,
    p_payment_method: v.payment_method ?? null,
    p_notes: v.notes ?? null,
  })

  if (error) {
    reportError(error, { where: 'createReservation', payload: v })
    console.error('[createReservation] RPC error:', error.message)
    return { ok: false, error: '予約の送信に失敗しました。時間をおいて再度お試しください。' }
  }

  const result = data as { ok: boolean; error?: string } | null
  if (!result?.ok) {
    return { ok: false, error: result?.error || '予約登録に失敗しました' }
  }

  // 管理者通知 (best-effort)
  await notifyAdmin(
    reservationCreatedMessage({
      name: v.customer_name,
      phone: v.customer_phone,
      area: v.area,
      date: v.reservation_date,
      time: v.reservation_time,
      location: v.location,
      quantity: v.quantity,
    })
  )

  revalidatePath('/admin')
  redirect('/reserve/complete')
}

export async function findReservationsByPhone(phone: string) {
  const normalized = normalizePhone(phone)
  if (!normalized) return []
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('find_reservations_by_phone', { p_phone: normalized })
  if (error) {
    console.error('[findReservationsByPhone] RPC error:', error)
    return []
  }
  return data || []
}

export async function cancelReservationByPhone(
  id: string,
  phone: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = cancelSchema.safeParse({ id, phone })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || '情報が不足しています' }
  }
  const supabase = await createClient()
  // キャンセル前に通知用情報を取得
  const { data: snapshot } = await supabase
    .from('reservations')
    .select('reservation_date, reservation_time, area')
    .eq('id', parsed.data.id)
    .maybeSingle()
  const { data, error } = await supabase.rpc('cancel_reservation_by_phone', {
    p_reservation_id: parsed.data.id,
    p_phone: parsed.data.phone,
  })
  if (error) {
    console.error('[cancelReservationByPhone] RPC error:', error)
    return { ok: false, error: 'キャンセルに失敗しました' }
  }
  const result = data as { ok: boolean; error?: string } | null
  if (result?.ok && snapshot) {
    await notifyAdmin(
      reservationCancelledMessage({
        date: snapshot.reservation_date,
        time: snapshot.reservation_time,
        area: snapshot.area,
      })
    )
  }
  return result || { ok: false, error: 'キャンセルに失敗しました' }
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
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('areas')
    .select('id, label, max_units')
    .eq('is_active', true)
    .order('created_at')
  if (error) {
    console.error('[getAreasWithUnits]', error)
    return []
  }
  return (data || []).map((a) => ({
    id: a.id as string,
    label: a.label as string,
    max_units: typeof a.max_units === 'number' ? a.max_units : 0,
  }))
}

export async function getFlavors() {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('flavors')
    .select('id, name, stock')
    .gt('stock', 0)
    .order('name')
  if (error) return []
  return data || []
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
  await audit('bar.create', { type: 'bar' }, { name, area })
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
  await audit('bar.update', { type: 'bar', id }, { name, area })
  revalidatePath('/admin/bars')
  return redirect('/admin/bars')
}

export async function deleteBar(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/bars')
  await supabase.from('bars').delete().eq('id', id)
  await audit('bar.delete', { type: 'bar', id })
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
  await audit('flavor.create', { type: 'flavor' }, { name, stock })
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
  await audit('flavor.update', { type: 'flavor', id }, { name, stock })
  revalidatePath('/admin/flavors')
  return redirect('/admin/flavors')
}

export async function deleteFlavor(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return redirect('/admin/flavors')
  await supabase.from('flavors').delete().eq('id', id)
  await audit('flavor.delete', { type: 'flavor', id })
  revalidatePath('/admin/flavors')
  return redirect('/admin/flavors')
}
