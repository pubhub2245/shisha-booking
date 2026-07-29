import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

/** ログイン中のユーザーと profiles を返す（未ログインなら null）。DB 未接続でも落とさない。 */
export async function getCurrentUser(): Promise<{ id: string; email?: string; profile: Profile | null } | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    return { id: user.id, email: user.email, profile: (profile as Profile) ?? null }
  } catch {
    return null
  }
}
