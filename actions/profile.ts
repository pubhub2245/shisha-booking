'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileState = { ok?: boolean; error?: string } | null

/** 表示モード（初心者=simple / プロ=pro）を切り替える。 */
export async function setUiMode(mode: 'simple' | 'pro'): Promise<{ ok: true } | { error: string }> {
  if (mode !== 'simple' && mode !== 'pro') return { error: '不正なモードです。' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase.from('profiles').update({ ui_mode: mode }).eq('id', user.id)
  if (error) return { error: '切り替えに失敗しました。' }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const displayName = String(formData.get('display_name') ?? '').trim() || null
  const username = String(formData.get('username') ?? '').trim() || null
  const bio = String(formData.get('bio') ?? '').trim() || null

  // 店舗は独立エンティティ（shops）に分離。is_shop は所属承認トリガーで同期するため触らない。
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, username, bio })
    .eq('id', user.id)

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { error: 'そのユーザー名は既に使われています。' }
    }
    return { error: '保存に失敗しました。' }
  }

  revalidatePath('/mypage')
  revalidatePath('/', 'layout')
  return { ok: true }
}
