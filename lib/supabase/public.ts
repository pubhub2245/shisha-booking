import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 公開データ (areas, flavors, bars) 用の Cookie 不要クライアント。
// セッションを扱わないので Server Component / Route Handler / Server Action から
// 自由に呼び出せる。 anon RLS でアクセス制御する前提。
export function createPublicClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
