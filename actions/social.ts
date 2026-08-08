'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CommentState = { error: string } | { ok: true } | null

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const mixId = String(formData.get('mix_id') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!mixId) return { error: '対象が不明です。' }
  if (!body) return { error: 'コメントを入力してください。' }
  if (body.length > 500) return { error: 'コメントは500文字以内で入力してください。' }

  const { error } = await supabase.from('comments').insert({ mix_id: mixId, user_id: user.id, body })
  if (error) return { error: 'コメントの投稿に失敗しました。' }

  // 投稿者に通知
  const { data: target } = await supabase.from('mixes').select('author_id').eq('id', mixId).maybeSingle()
  if (target?.author_id) {
    await supabase.rpc('notify', { p_recipient: target.author_id as string, p_type: 'comment', p_mix: mixId })
  }

  revalidatePath(`/mix/${mixId}`)
  return { ok: true }
}

export async function deleteComment(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = String(formData.get('id') ?? '')
  const mixId = String(formData.get('mix_id') ?? '')
  if (!id) return
  await supabase.from('comments').delete().eq('id', id).eq('user_id', user.id)
  if (mixId) revalidatePath(`/mix/${mixId}`)
}

/** ブックマークのトグル。戻り値で最新状態を返す。 */
export async function toggleBookmark(mixId: string): Promise<{ saved: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('mix_id')
    .eq('mix_id', mixId)
    .eq('user_id', user.id)
    .maybeSingle()

  let saved: boolean
  if (existing) {
    await supabase.from('bookmarks').delete().eq('mix_id', mixId).eq('user_id', user.id)
    saved = false
  } else {
    await supabase.from('bookmarks').insert({ mix_id: mixId, user_id: user.id })
    saved = true
  }
  revalidatePath('/mypage')
  return { saved }
}

/** フォローのトグル。 */
export async function toggleFollow(targetId: string): Promise<{ following: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  if (user.id === targetId) return { error: '自分はフォローできません。' }

  const { data: existing } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle()

  let following: boolean
  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
    following = false
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
    following = true
    await supabase.rpc('notify', { p_recipient: targetId, p_type: 'follow' })
  }
  revalidatePath('/', 'layout')
  return { following }
}

/** 不適切コンテンツの通報 */
export async function reportContent(input: {
  mixId?: string
  commentId?: string
  reason: string
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const reason = (input.reason || '').slice(0, 300)
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    mix_id: input.mixId ?? null,
    comment_id: input.commentId ?? null,
    reason: reason || null,
  })
  if (error) return { error: '通報の送信に失敗しました。' }
  return { ok: true }
}

/** 閲覧数 +1（best-effort） */
export async function incrementView(mixId: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.rpc('increment_view', { p_mix_id: mixId })
  } catch {
    // best-effort
  }
}
