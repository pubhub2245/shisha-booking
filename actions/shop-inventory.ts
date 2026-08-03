'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** お店の在庫棚にフレーバーを追加/削除（トグル）。承認済みメンバーのみ（RLSで担保）。 */
export async function toggleShopFlavor(
  shopId: string,
  flavorId: string
): Promise<{ inStock: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  // 承認済みメンバーか確認
  const { data: membership } = await supabase
    .from('shop_members')
    .select('status')
    .eq('shop_id', shopId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership || (membership as { status: string }).status !== 'approved') {
    return { error: 'このお店の在庫を編集する権限がありません。' }
  }

  const { data: existing } = await supabase
    .from('shop_flavors')
    .select('flavor_id')
    .eq('shop_id', shopId)
    .eq('flavor_id', flavorId)
    .maybeSingle()

  let inStock: boolean
  if (existing) {
    await supabase.from('shop_flavors').delete().eq('shop_id', shopId).eq('flavor_id', flavorId)
    inStock = false
  } else {
    await supabase.from('shop_flavors').insert({ shop_id: shopId, flavor_id: flavorId })
    inStock = true
  }
  revalidatePath(`/shop/${shopId}`)
  revalidatePath(`/shop/${shopId}/manage`)
  revalidatePath('/', 'layout')
  return { inStock }
}
