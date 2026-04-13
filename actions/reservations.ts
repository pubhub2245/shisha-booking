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
  const flavorRequest = (formData.get('flavor_request') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!name || !phone || !reservationDate || !reservationTime || !area || !location) {
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
    await supabase.from('customers').update({ name, notes }).eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({ name, phone, area })
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
    flavor_request: flavorRequest,
    admin_note: notes,
    status: 'received',
  })

  if (reservationError) {
    return redirect('/reserve')
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
