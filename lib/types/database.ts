// Supabase テーブル/RPC の最小限の型定義。
// 本来は `supabase gen types typescript` で自動生成すべきだが、
// 当面は migration から手書きで起こしておく。

export type Role = 'admin' | 'staff'
export type ReservationStatus =
  | 'received'
  | 'checking'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'closed'

export type Customer = {
  id: string
  name: string
  name_kana: string | null
  phone: string | null
  contact_sns: string | null
  area: string | null
  notes: string | null
  first_used_at: string | null
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  name: string
  phone: string | null
  role: Role
  available_area: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Reservation = {
  id: string
  customer_id: string | null
  reservation_date: string
  reservation_time: string
  location: string
  area: string
  quantity: number
  flavor_id: string | null
  flavor_request: string | null
  payment_method: string | null
  status: ReservationStatus
  assigned_staff_id: string | null
  admin_note: string | null
  field_note: string | null
  created_at: string
  updated_at: string
}

export type Area = {
  id: string
  prefecture: string
  city: string
  label: string
  is_active: boolean
  max_units: number
  created_at: string
}

export type Bar = {
  id: string
  name: string
  address: string
  area: string
  created_at: string
}

export type Flavor = {
  id: string
  name: string
  stock: number
  created_at: string
}

export type AuditLog = {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  resource_type: string
  resource_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

// Supabase クライアントの Generic に渡す Database 型
type Tbl<R, Rel extends ReadonlyArray<unknown> = []> = {
  Row: R
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: Rel
}

export type Database = {
  public: {
    Tables: {
      customers: Tbl<Customer>
      profiles: Tbl<Profile>
      reservations: Tbl<
        Reservation,
        [
          {
            foreignKeyName: 'reservations_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_assigned_staff_id_fkey'
            columns: ['assigned_staff_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_flavor_id_fkey'
            columns: ['flavor_id']
            isOneToOne: false
            referencedRelation: 'flavors'
            referencedColumns: ['id']
          }
        ]
      >
      areas: Tbl<Area>
      bars: Tbl<Bar>
      flavors: Tbl<Flavor>
      audit_logs: Tbl<AuditLog>
      login_attempts: Tbl<{ id: string; ip: string; email: string | null; created_at: string }>
    }
    Views: Record<string, never>
    Functions: {
      create_reservation_atomic: {
        Args: {
          p_name: string
          p_name_kana: string | null
          p_phone: string
          p_area: string
          p_reservation_date: string
          p_reservation_time: string
          p_location: string
          p_quantity: number
          p_flavor_id: string | null
          p_instagram: string | null
          p_payment_method: string | null
          p_notes: string | null
        }
        Returns: { ok: boolean; error?: string; reservation_id?: string }
      }
      cancel_reservation_by_phone: {
        Args: { p_reservation_id: string; p_phone: string }
        Returns: { ok: boolean; error?: string }
      }
      find_reservations_by_phone: {
        Args: { p_phone: string }
        Returns: Array<{
          id: string
          reservation_date: string
          reservation_time: string
          area: string
          location: string
          quantity: number
          status: ReservationStatus
          customer_name: string
        }>
      }
      check_login_rate_limit: {
        Args: { p_ip: string; p_email: string | null }
        Returns: { allowed: boolean; retry_after_seconds?: number }
      }
    }
    Enums: Record<string, never>
  }
}

export type ReservationFormData = {
  customer_name: string
  customer_phone: string
  customer_sns: string
  reservation_date: string
  reservation_time: string
  location: string
  area: string
  quantity: number
  flavor_request: string
  payment_method: string
  notes: string
}
