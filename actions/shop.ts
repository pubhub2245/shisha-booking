'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ShopFormState = { error?: string } | null

/** お店を新規登録。登録者がオーナー（承認済みメンバー）になる。成功時は管理画面へ。 */
export async function createShop(_prev: ShopFormState, formData: FormData): Promise<ShopFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: '店舗名を入力してください。' }
  const area = String(formData.get('area') ?? '').trim() || null
  const url = String(formData.get('url') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null

  const { data: shop, error } = await supabase
    .from('shops')
    .insert({ name, area, url, description, owner_id: user.id })
    .select('id')
    .single()
  if (error || !shop) return { error: 'お店の登録に失敗しました。' }

  const shopId = (shop as { id: string }).id
  const { error: mErr } = await supabase
    .from('shop_members')
    .insert({ shop_id: shopId, user_id: user.id, role: 'owner', status: 'approved' })
  if (mErr) return { error: '所属の登録に失敗しました。' }

  revalidatePath('/shops')
  revalidatePath('/mypage')
  redirect(`/shop/${shopId}/manage`)
}

/** お店情報を更新（オーナーのみ / RLSで担保）。 */
export async function updateShop(shopId: string, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: '店舗名を入力してください。' }
  const area = String(formData.get('area') ?? '').trim() || null
  const url = String(formData.get('url') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null

  const { error } = await supabase.from('shops').update({ name, area, url, description }).eq('id', shopId)
  if (error) return { error: '更新に失敗しました（オーナーのみ編集できます）。' }
  revalidatePath(`/shop/${shopId}`)
  revalidatePath(`/shop/${shopId}/manage`)
  return { ok: true }
}

/** このお店に「参加申請」する（staff / pending）。オーナー承認で所属確定。 */
export async function requestJoinShop(shopId: string): Promise<{ status: 'pending' } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase
    .from('shop_members')
    .insert({ shop_id: shopId, user_id: user.id, role: 'staff', status: 'pending' })
  if (error) return { error: '申請に失敗しました。' }
  revalidatePath(`/shop/${shopId}`)
  return { status: 'pending' }
}

/** 参加申請を取り消す / 退店する（自分の所属を削除）。 */
export async function leaveShop(shopId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase.from('shop_members').delete().eq('shop_id', shopId).eq('user_id', user.id)
  if (error) return { error: '取り消しに失敗しました。' }
  revalidatePath(`/shop/${shopId}`)
  revalidatePath('/mypage')
  return { ok: true }
}

/** オーナーが参加申請を承認する。 */
export async function approveMember(shopId: string, userId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { error } = await supabase
    .from('shop_members')
    .update({ status: 'approved' })
    .eq('shop_id', shopId)
    .eq('user_id', userId)
  if (error) return { error: '承認に失敗しました（オーナーのみ）。' }
  revalidatePath(`/shop/${shopId}/manage`)
  revalidatePath(`/shop/${shopId}`)
  return { ok: true }
}

/**
 * オーナー権限を、同じ店舗の承認済みメンバーへ譲渡する。
 * DB 側の SECURITY DEFINER 関数で「現オーナーのみ／承認済みメンバー宛て」を検証して原子的に更新。
 * （導入時：最初に対応した従業員が仮オーナー → 後から本来のオーナーへ引き継ぐ用途）
 */
export async function transferShopOwnership(
  shopId: string,
  newOwnerId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { error } = await supabase.rpc('transfer_shop_ownership', {
    p_shop_id: shopId,
    p_new_owner: newOwnerId,
  })
  if (error) {
    // 関数未適用（マイグレーション未反映）などの場合の保険
    if (error.message?.includes('function') || (error as { code?: string }).code === 'PGRST202') {
      return { error: 'この機能はまだ準備中です（データベース更新の反映待ち）。少し時間をおいてお試しください。' }
    }
    if (error.message?.includes('approved member')) {
      return { error: '譲渡先は、承認済みの所属スタッフである必要があります。' }
    }
    if (error.message?.includes('current owner')) {
      return { error: 'オーナーのみが権限を譲渡できます。' }
    }
    return { error: '権限の譲渡に失敗しました。' }
  }
  revalidatePath(`/shop/${shopId}`)
  revalidatePath(`/shop/${shopId}/manage`)
  revalidatePath('/mypage')
  return { ok: true }
}

/** オーナーがメンバー（申請）を削除／除名する。オーナー自身は不可。 */
export async function removeMember(shopId: string, userId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  if (userId === user.id) return { error: 'オーナー自身は削除できません。' }
  const { error } = await supabase.from('shop_members').delete().eq('shop_id', shopId).eq('user_id', userId)
  if (error) return { error: '削除に失敗しました。' }
  revalidatePath(`/shop/${shopId}/manage`)
  revalidatePath(`/shop/${shopId}`)
  return { ok: true }
}
