'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** 店の在庫棚にフレーバーを追加/削除（トグル）。店アカウントのみ。 */
export async function toggleShopFlavor(
  flavorId: string
): Promise<{ inStock: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  // 店アカウントか確認
  const { data: profile } = await supabase.from('profiles').select('is_shop, username').eq('id', user.id).maybeSingle()
  if (!profile?.is_shop) return { error: '店舗アカウントのみ在庫を編集できます。' }

  const { data: existing } = await supabase
    .from('shop_flavors')
    .select('flavor_id')
    .eq('shop_id', user.id)
    .eq('flavor_id', flavorId)
    .maybeSingle()

  let inStock: boolean
  if (existing) {
    await supabase.from('shop_flavors').delete().eq('shop_id', user.id).eq('flavor_id', flavorId)
    inStock = false
  } else {
    await supabase.from('shop_flavors').insert({ shop_id: user.id, flavor_id: flavorId })
    inStock = true
  }
  revalidatePath('/shop/inventory')
  if (profile.username) revalidatePath(`/s/${profile.username}`)
  revalidatePath('/', 'layout')
  return { inStock }
}
