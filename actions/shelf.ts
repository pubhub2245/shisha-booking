'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** 棚にフレーバーを追加/削除（トグル）。戻り値で最新状態。 */
export async function toggleShelf(flavorId: string): Promise<{ owned: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('shelf')
    .select('flavor_id')
    .eq('user_id', user.id)
    .eq('flavor_id', flavorId)
    .maybeSingle()

  let owned: boolean
  if (existing) {
    await supabase.from('shelf').delete().eq('user_id', user.id).eq('flavor_id', flavorId)
    owned = false
  } else {
    await supabase.from('shelf').insert({ user_id: user.id, flavor_id: flavorId })
    owned = true
  }
  revalidatePath('/shelf')
  revalidatePath('/', 'layout')
  return { owned }
}
