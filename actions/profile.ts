'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileState = { ok?: boolean; error?: string } | null

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const displayName = String(formData.get('display_name') ?? '').trim() || null
  const username = String(formData.get('username') ?? '').trim() || null
  const bio = String(formData.get('bio') ?? '').trim() || null
  const isShop = formData.get('is_shop') === 'on'
  const shopName = String(formData.get('shop_name') ?? '').trim() || null
  const shopArea = String(formData.get('shop_area') ?? '').trim() || null
  const shopUrl = String(formData.get('shop_url') ?? '').trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username,
      bio,
      is_shop: isShop,
      shop_name: isShop ? shopName : null,
      shop_area: isShop ? shopArea : null,
      shop_url: isShop ? shopUrl : null,
    })
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
