'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

async function isAdmin(supabase: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  return !!data?.is_admin
}

/** 通報を対応済みにする（削除）。管理者のみ。 */
export async function adminDismissReport(formData: FormData): Promise<void> {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return
  const id = Number(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('reports').delete().eq('id', id)
  revalidatePath('/admin/reports')
}

/** 通報されたミックスを削除する（モデレーション）。管理者のみ。 */
export async function adminDeleteMix(formData: FormData): Promise<void> {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return
  const mixId = String(formData.get('mix_id') ?? '')
  if (!mixId) return
  await supabase.from('mixes').delete().eq('id', mixId)
  await supabase.from('reports').delete().eq('mix_id', mixId)
  revalidatePath('/admin/reports')
  revalidatePath('/')
}
