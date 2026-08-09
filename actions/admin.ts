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

/**
 * 自動非表示（通報多数）を解除して公開に戻す。誤検知の救済用。管理者のみ。
 * mix_id か comment_id のどちらかを渡す。通報も併せて解消する。
 */
export async function adminRestoreContent(formData: FormData): Promise<void> {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return
  const mixId = String(formData.get('mix_id') ?? '')
  const commentId = String(formData.get('comment_id') ?? '')
  if (mixId) {
    await supabase.from('mixes').update({ hidden: false }).eq('id', mixId)
    await supabase.from('reports').delete().eq('mix_id', mixId)
    revalidatePath('/')
  } else if (commentId) {
    await supabase.from('comments').update({ hidden: false }).eq('id', commentId)
    await supabase.from('reports').delete().eq('comment_id', commentId)
  }
  revalidatePath('/admin/reports')
}
