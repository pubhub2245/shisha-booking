'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getNationalRepCategories } from '@/lib/queries'

export type MixNameState = { error: string } | { ok: true } | null

/** 愛称案を提案する（日本代表ミックスのみ）。 */
export async function proposeMixName(mixId: string, nameRaw: string): Promise<MixNameState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const name = (nameRaw ?? '').trim().slice(0, 30)
  if (!name) return { error: '名前を入力してください。' }

  // 対象は日本代表に選ばれたミックスのみ
  const cats = await getNationalRepCategories(mixId)
  if (cats.length === 0) return { error: '公募は日本代表に選ばれたミックスのみです。' }

  const { error } = await supabase.from('mix_names').insert({ mix_id: mixId, user_id: user.id, name })
  if (error) {
    if (error.code === '23505') return { error: 'その名前はすでに提案されています。' }
    return { error: '提案に失敗しました。時間をおいて再度お試しください。' }
  }
  // 自分の提案には自動で1票
  const { data: inserted } = await supabase
    .from('mix_names')
    .select('id')
    .eq('mix_id', mixId)
    .eq('name', name)
    .maybeSingle()
  if (inserted) {
    await supabase.from('mix_name_votes').insert({ name_id: (inserted as { id: number }).id, user_id: user.id })
  }
  revalidatePath(`/mix/${mixId}`)
  return { ok: true }
}

/** 愛称案への投票（トグル）。 */
export async function voteMixName(nameId: number): Promise<{ votes: number; myVote: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: nameRow } = await supabase.from('mix_names').select('mix_id').eq('id', nameId).maybeSingle()
  const mixId = (nameRow as { mix_id: string } | null)?.mix_id

  const { data: existing } = await supabase
    .from('mix_name_votes')
    .select('name_id')
    .eq('name_id', nameId)
    .eq('user_id', user.id)
    .maybeSingle()
  let myVote: boolean
  if (existing) {
    await supabase.from('mix_name_votes').delete().eq('name_id', nameId).eq('user_id', user.id)
    myVote = false
  } else {
    await supabase.from('mix_name_votes').insert({ name_id: nameId, user_id: user.id })
    myVote = true
  }
  const { count } = await supabase.from('mix_name_votes').select('name_id', { count: 'exact', head: true }).eq('name_id', nameId)
  if (mixId) revalidatePath(`/mix/${mixId}`)
  return { votes: count ?? 0, myVote }
}

/** 愛称案の削除（提案者本人または管理者）。 */
export async function deleteMixName(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  const mixId = String(formData.get('mix_id') ?? '')
  if (!id) return
  await supabase.from('mix_names').delete().eq('id', id)
  if (mixId) revalidatePath(`/mix/${mixId}`)
}
