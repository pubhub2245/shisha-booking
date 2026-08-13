import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * クッキー非依存の匿名（anon）クライアント。
 * 公開データ（図鑑・王道・地域ランキング等）の重い集計を `unstable_cache` で
 * キャッシュする用途に使う。`cookies()` を参照しないため、キャッシュスコープ内でも安全。
 * RLS は anon として適用され、公開 SELECT のみ読む（ユーザー個別データには使わない）。
 */
export function createPublicClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
