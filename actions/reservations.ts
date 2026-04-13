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
  const flavorId = (formData.get('flavor_id') as string) || null
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
    flavor_id: flavorId,
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

export async function getFlavors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('flavors')
    .select('id, name, stock')
    .gt('stock', 0)
    .order('name')
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
