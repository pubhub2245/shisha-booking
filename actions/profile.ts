'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeUsername } from '@/lib/username'
import { isValidMixPhotoUrl } from '@/lib/storage'

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
  // 先頭の「@」や空白を自動除去（@@name の二重付与を防ぐ）
  const username = sanitizeUsername(String(formData.get('username') ?? '')) || null
  const bio = String(formData.get('bio') ?? '').trim() || null

  const update: Record<string, unknown> = { display_name: displayName, username, bio }
  // プロフィール画像（自分のストレージ公開URLのみ許可。空なら削除）
  if (formData.has('avatar_url')) {
    const avatarRaw = String(formData.get('avatar_url') ?? '').trim()
    if (avatarRaw === '') {
      update.avatar_url = null
    } else if (isValidMixPhotoUrl(avatarRaw)) {
      update.avatar_url = avatarRaw
    } else {
      return { error: '画像の保存に失敗しました。もう一度アップロードしてください。' }
    }
  }

  // 店舗は独立エンティティ（shops）に分離。is_shop は所属承認トリガーで同期するため触らない。
  const { error } = await supabase.from('profiles').update(update).eq('id', user.id)

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
