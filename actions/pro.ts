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
  const shopName = String(formData.get('shop_name') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim() || null

  if (!snsType) return { error: 'SNSの種類を選んでください。' }
  if (!snsHandle) return { error: 'SNSアカウント（@またはURL）を入力してください。' }
  if (!shopName) return { error: '在籍しているシーシャ店名を入力してください。' }

  const { error } = await supabase.from('pro_applications').insert({
    user_id: user.id,
    sns_type: snsType,
    sns_handle: snsHandle,
    shop_name: shopName,
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
