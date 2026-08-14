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
  const parentId = String(formData.get('parent_id') ?? '').trim() || null
  if (!mixId) return { error: '対象が不明です。' }
  if (!body) return { error: 'コメントを入力してください。' }
  if (body.length > 500) return { error: 'コメントは500文字以内で入力してください。' }

  const { error } = await supabase.from('comments').insert({ mix_id: mixId, user_id: user.id, body, parent_id: parentId })
  if (error) return { error: 'コメントの投稿に失敗しました。' }

  // 投稿者に通知
  const { data: target } = await supabase.from('mixes').select('author_id').eq('id', mixId).maybeSingle()
  if (target?.author_id) {
    await supabase.rpc('notify', { p_recipient: target.author_id as string, p_type: 'comment', p_mix: mixId })
  }
  // 返信なら親コメントの投稿者にも通知
  if (parentId) {
    const { data: parent } = await supabase.from('comments').select('user_id').eq('id', parentId).maybeSingle()
    if (parent?.user_id) {
      await supabase.rpc('notify', { p_recipient: parent.user_id as string, p_type: 'reply', p_mix: mixId })
    }
  }
  // @メンションの通知
  const handles = [...new Set((body.match(/@([A-Za-z0-9_]{2,30})/g) ?? []).map((s) => s.slice(1)))].slice(0, 5)
  if (handles.length > 0) {
    const { data: mentioned } = await supabase.from('profiles').select('id').in('username', handles)
    for (const m of (mentioned ?? []) as { id: string }[]) {
      await supabase.rpc('notify', { p_recipient: m.id, p_type: 'mention', p_mix: mixId })
    }
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

/** コメントへのいいねトグル。 */
export async function toggleCommentLike(commentId: string): Promise<{ liked: boolean; count: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked: boolean
  if (existing) {
    await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
    liked = false
  } else {
    await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
    liked = true
    const { data: c } = await supabase.from('comments').select('user_id, mix_id').eq('id', commentId).maybeSingle()
    if (c?.user_id) {
      await supabase.rpc('notify', { p_recipient: c.user_id as string, p_type: 'comment_like', p_mix: c.mix_id as string })
    }
  }
  const { count } = await supabase.from('comment_likes').select('comment_id', { count: 'exact', head: true }).eq('comment_id', commentId)
  const { data: c2 } = await supabase.from('comments').select('mix_id').eq('id', commentId).maybeSingle()
  if (c2?.mix_id) revalidatePath(`/mix/${c2.mix_id}`)
  return { liked, count: count ?? 0 }
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

/**
 * 「作ってみた」を記録（追記型）。mix_experiences(experience_type='made') に1件追加する。
 * made も履歴なので、再実行しても過去の made 記録は削除しない（取り消しは煙道帳からの明示削除のみ）。
 * 通知は初回のみ（連投で作者に通知が飛び続けないように）。
 */
export async function logMadeExperience(mixId: string): Promise<{ made: boolean; count: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('mix_experiences')
    .select('id')
    .eq('mix_id', mixId)
    .eq('user_id', user.id)
    .eq('experience_type', 'made')
    .limit(1)
    .maybeSingle()
  const isFirst = !existing

  const { error } = await supabase.from('mix_experiences').insert({
    mix_id: mixId,
    user_id: user.id,
    experience_type: 'made',
  })
  if (error) return { error: '記録に失敗しました。' }

  if (isFirst) {
    const { data: target } = await supabase.from('mixes').select('author_id').eq('id', mixId).maybeSingle()
    if (target?.author_id) {
      await supabase.rpc('notify', { p_recipient: target.author_id as string, p_type: 'make', p_mix: mixId })
    }
  }

  const { data: status } = await supabase.rpc('mix_made_status', { p_mix: mixId })
  const count = status?.[0]?.maker_count ?? 0
  revalidatePath(`/mix/${mixId}`)
  return { made: true, count }
}


/**
 * 「吸った」を記録（最小フロー）。追記型：同じミックスを何度でも記録できる。
 * verdict は任意で後から setExperienceVerdict で付ける。
 */
export async function logSmoke(
  mixId: string,
  verdict?: 'again' | 'good' | 'ok' | 'not_for_me'
): Promise<{ id: string; count: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: row, error } = await supabase
    .from('mix_experiences')
    .insert({
      mix_id: mixId,
      user_id: user.id,
      experience_type: 'smoked',
      verdict: verdict ?? null,
    })
    .select('id')
    .single()
  if (error || !row) return { error: '記録に失敗しました。' }

  const { data: status } = await supabase.rpc('mix_smoke_status', { p_mix: mixId })
  const count = status?.[0]?.smoke_count ?? 0
  revalidatePath(`/mix/${mixId}`)
  return { id: row.id as string, count }
}

/** 「どうだった？」——直近の吸った記録に満足度(verdict)を付ける（本人のみ）。 */
export async function setExperienceVerdict(
  experienceId: string,
  verdict: 'again' | 'good' | 'ok' | 'not_for_me'
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase
    .from('mix_experiences')
    .update({ verdict })
    .eq('id', experienceId)
    .eq('user_id', user.id)
  if (error) return { error: '保存に失敗しました。' }
  return { ok: true }
}

/** フレーバー評価（★1-5）。upsert。 */
export async function rateFlavor(
  flavorId: string,
  rating: number
): Promise<{ avg: number; count: number; mine: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const r = Math.max(1, Math.min(5, Math.round(rating)))
  const { error } = await supabase
    .from('flavor_ratings')
    .upsert({ flavor_id: flavorId, user_id: user.id, rating: r }, { onConflict: 'flavor_id,user_id' })
  if (error) return { error: '評価の保存に失敗しました。' }
  const { data } = await supabase.from('flavor_ratings').select('rating').eq('flavor_id', flavorId)
  const ratings = (data ?? []).map((x) => (x as { rating: number }).rating)
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  revalidatePath(`/flavor/${flavorId}`)
  return { avg, count: ratings.length, mine: r }
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

/**
 * 煙道帳の記録を1件だけ削除する（誤登録の取り消し）。
 * 削除は experience 単位。同じミックスの他の履歴は消さない。RLS でも本人限定。
 */
export async function deleteExperience(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = String(formData.get('experience_id') ?? '')
  if (!id) return
  await supabase.from('mix_experiences').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/mypage')
}
