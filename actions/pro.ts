'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProAppState = { error: string } | { ok: true } | null

export async function submitProApplication(_prev: ProAppState, formData: FormData): Promise<ProAppState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const snsTypeRaw = String(formData.get('sns_type') ?? '')
  const snsType = snsTypeRaw === 'x' || snsTypeRaw === 'instagram' ? snsTypeRaw : null
  const snsHandle = String(formData.get('sns_handle') ?? '').trim()
  const shopIdRaw = String(formData.get('shop_id') ?? '').trim()
  let shopName = String(formData.get('shop_name') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim() || null

  if (!snsType) return { error: 'SNSの種類を選んでください。' }
  if (!snsHandle) return { error: 'SNSアカウント（@またはURL）を入力してください。' }

  // 所属店舗が選ばれた場合は、本人が承認済みメンバーか検証し、店名を採用する
  let shopId: string | null = null
  if (shopIdRaw) {
    const { data: mem } = await supabase
      .from('shop_members')
      .select('status')
      .eq('shop_id', shopIdRaw)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!mem || (mem as { status: string }).status !== 'approved') {
      return { error: '選択したお店に所属していません。先にお店への参加が承認される必要があります。' }
    }
    const { data: shop } = await supabase.from('shops').select('name').eq('id', shopIdRaw).maybeSingle()
    if (!shop) return { error: '選択したお店が見つかりません。' }
    shopId = shopIdRaw
    shopName = (shop as { name: string }).name
  }
  if (!shopName) return { error: '在籍しているシーシャ店名を入力してください。' }

  const { error } = await supabase.from('pro_applications').insert({
    user_id: user.id,
    sns_type: snsType,
    sns_handle: snsHandle,
    shop_name: shopName,
    shop_id: shopId,
    message,
  })
  if (error) {
    if (error.code === '23505') return { error: '審査中の申請がすでにあります。結果をお待ちください。' }
    return { error: '申請の送信に失敗しました。時間をおいて再度お試しください。' }
  }

  revalidatePath('/mypage')
  return { ok: true }
}

export async function reviewProApplication(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = String(formData.get('id') ?? '')
  const approve = String(formData.get('approve') ?? '') === 'true'
  if (!id) return
  await supabase.rpc('review_pro_application', { p_app_id: id, p_approve: approve })
  revalidatePath('/admin/pro')
  revalidatePath('/', 'layout')
}
