export type Role = 'admin' | 'staff'
export type ReservationStatus = 'received' | 'checking' | 'confirmed' | 'completed' | 'cancelled' | 'closed'

export type Customer = {
  id: string; name: string; phone: string | null; contact_sns: string | null
  area: string | null; notes: string | null; first_used_at: string | null
  created_at: string; updated_at: string
}
export type Profile = {
  id: string; name: string; phone: string | null; role: Role
  available_area: string | null; is_active: boolean; created_at: string; updated_at: string
}
export type Reservation = {
  id: string; customer_id: string | null; reservation_date: string; reservation_time: string
  location: string; area: string; quantity: number; flavor_request: string | null
  payment_method: string | null; status: ReservationStatus; assigned_staff_id: string | null
  admin_note: string | null; field_note: string | null; created_at: string; updated_at: string
}
export type ReservationFormData = {
  customer_name: string; customer_phone: string; customer_sns: string
  reservation_date: string; reservation_time: string; location: string; area: string
  quantity: number; flavor_request: string; payment_method: string; notes: string
}
