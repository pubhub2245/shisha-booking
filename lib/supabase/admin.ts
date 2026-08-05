import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * サービスロールの Supabase クライアント（RLS をバイパス）。
 * サーバー内（決済Webフック等）でのみ使用すること。SERVICE_ROLE_KEY 未設定なら null。
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
