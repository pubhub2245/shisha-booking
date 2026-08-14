'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 王道の認定・変更（運営のみ）。権限と combo_key の整合性は DB 側（RPC＋トリガ）で担保する。
 * ここではアプリ側の入口として RPC を呼ぶだけ。
 */
export async function certifyOrthodoxy(mixId: string, comboKey?: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('certify_orthodoxy', {
    p_mix: mixId,
    p_combo_key: comboKey ?? null,
  })
  if (error) return { error: error.message || '王道の認定に失敗しました。' }
  revalidatePath(`/mix/${mixId}`)
  revalidatePath('/admin/orthodoxy')
  return { ok: true }
}

/** 王道の解除（運営のみ）。 */
export async function revokeOrthodoxy(comboKey: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('revoke_orthodoxy', { p_combo_key: comboKey })
  if (error) return { error: error.message || '王道の解除に失敗しました。' }
  revalidatePath('/admin/orthodoxy')
  return { ok: true }
}

/**
 * 「この作り方を推薦する」。推薦できるのは運営・認証プロのみ（RLS の can_recommend() で担保）。
 * 一般ユーザーの支持は 吸った/作ってみた/verdict として別に蓄積する。
 */
export async function recommendMethod(mixId: string, note?: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { error } = await supabase.from('method_recommendations').insert({
    mix_id: mixId,
    proposed_by: user.id,
    note: note?.trim() ? note.trim().slice(0, 300) : null,
  })
  if (error) {
    // UNIQUE(mix_id, proposed_by) 違反＝すでに推薦済み
    if (error.code === '23505') return { error: 'すでに推薦しています。' }
    return { error: '推薦できませんでした。（推薦できるのは運営・認証プロのみです）' }
  }
  revalidatePath(`/mix/${mixId}`)
  return { ok: true }
}

/** 推薦の取り消し（本人か運営）。 */
export async function unrecommendMethod(mixId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase
    .from('method_recommendations')
    .delete()
    .eq('mix_id', mixId)
    .eq('proposed_by', user.id)
  if (error) return { error: '取り消しに失敗しました。' }
  revalidatePath(`/mix/${mixId}`)
  return { ok: true }
}
