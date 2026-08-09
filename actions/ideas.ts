'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { IDEA_CATEGORY_VALUES } from '@/lib/ideas'

export type IdeaState = { error: string } | { ok: true } | null

/** 意見を投稿する。 */
export async function createIdea(_prev: IdeaState, formData: FormData): Promise<IdeaState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim() || null
  const categoryRaw = String(formData.get('category') ?? '')
  const category = IDEA_CATEGORY_VALUES.includes(categoryRaw) ? categoryRaw : 'other'
  if (!title) return { error: 'タイトルを入力してください。' }
  if (title.length > 120) return { error: 'タイトルは120文字以内で入力してください。' }
  if (body && body.length > 1000) return { error: '本文は1000文字以内で入力してください。' }

  const { data: inserted, error } = await supabase
    .from('ideas')
    .insert({ user_id: user.id, title, body, category })
    .select('id')
    .single()
  if (error || !inserted) return { error: '投稿に失敗しました。時間をおいて再度お試しください。' }
  // 自分の投稿には自動で👍（改修希望のカウント）
  await supabase.from('idea_votes').upsert({ idea_id: inserted.id, user_id: user.id, value: 1 }, { onConflict: 'idea_id,user_id' })
  revalidatePath('/ideas')
  return { ok: true }
}

/** 投票（👍=1 / 👎=-1）。同じ値を再度押すと取り消し。 */
export async function voteIdea(
  ideaId: number,
  value: 1 | -1
): Promise<{ up: number; down: number; myVote: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('idea_votes')
    .select('value')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle()

  let myVote: number
  if (existing && existing.value === value) {
    await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', user.id)
    myVote = 0
  } else {
    await supabase.from('idea_votes').upsert({ idea_id: ideaId, user_id: user.id, value }, { onConflict: 'idea_id,user_id' })
    myVote = value
  }
  const { data: votes } = await supabase.from('idea_votes').select('value').eq('idea_id', ideaId)
  const rows = (votes ?? []) as { value: number }[]
  const up = rows.filter((v) => v.value === 1).length
  const down = rows.filter((v) => v.value === -1).length
  revalidatePath('/ideas')
  return { up, down, myVote }
}

/** 意見を削除（投稿者本人または管理者）。 */
export async function deleteIdea(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('ideas').delete().eq('id', id)
  revalidatePath('/ideas')
}

/** ステータス変更（管理者のみ・RLSで制御）。 */
export async function setIdeaStatus(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const id = Number(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['open', 'considering', 'done', 'declined'].includes(status)) return
  // 変更前の投稿者・状態を取得（通知用）
  const { data: before } = await supabase.from('ideas').select('user_id, status').eq('id', id).maybeSingle()
  await supabase.from('ideas').update({ status }).eq('id', id)
  // 状態が変わったら投稿者に通知（フィードバックの輪を閉じる）
  if (before?.user_id && before.status !== status && status !== 'open') {
    await supabase.rpc('notify', { p_recipient: before.user_id as string, p_type: `idea_${status}` })
  }
  revalidatePath('/ideas')
}
