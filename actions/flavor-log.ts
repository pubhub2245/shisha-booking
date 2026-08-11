'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FlavorLogState = { error: string } | { ok: true } | null

const HMS_VALUES = ['lotus', 'provost', 'turkish', 'steamulation', 'nagrani', 'aot', 'foil', 'other', 'kaloud']
const CHARCOAL_VALUES = ['cube', 'flat', 'ogatan', 'other']
const PACK_VALUES = ['fluff', 'layered', 'dense', 'flat', 'overpack', 'other']

function numOrNull(formData: FormData, key: string, min: number, max: number, round = false): number | null {
  const s = String(formData.get(key) ?? '').trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  const clamped = Math.max(min, Math.min(max, n))
  return round ? Math.round(clamped) : clamped
}
function strOrNull(formData: FormData, key: string, len: number): string | null {
  const s = String(formData.get(key) ?? '').trim()
  return s ? s.slice(0, len) : null
}
function enumOrNull(formData: FormData, key: string, allowed: string[]): string | null {
  const s = String(formData.get(key) ?? '').trim()
  return allowed.includes(s) ? s : null
}

/** ユーザーが承認済みメンバーの店なら shopId を返す。そうでなければ null。 */
async function approvedShopId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  shopId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('shop_members')
    .select('status')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle()
  return data && (data as { status: string }).status === 'approved' ? shopId : null
}

/** 既存ログの「店に共有」を切り替える（本人のみ）。 */
export async function toggleLogShopShare(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  const flavorId = String(formData.get('flavor_id') ?? '')
  const shopIdRaw = String(formData.get('shop_id') ?? '').trim()
  if (!id) return
  const { data: cur } = await supabase.from('flavor_logs').select('shop_id').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!cur) return
  // すでに共有中なら解除、そうでなければ指定店に共有（承認済みのみ）
  let next: string | null = null
  if (!(cur as { shop_id: string | null }).shop_id && shopIdRaw) {
    next = await approvedShopId(supabase, user.id, shopIdRaw)
  }
  await supabase.from('flavor_logs').update({ shop_id: next }).eq('id', id).eq('user_id', user.id)
  if (flavorId) revalidatePath(`/flavor/${flavorId}`)
}

/** 練習ログを1件追加する。 */
export async function addFlavorLog(_prev: FlavorLogState, formData: FormData): Promise<FlavorLogState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const flavorId = String(formData.get('flavor_id') ?? '')
  if (!flavorId) return { error: '対象が不明です。' }

  // 賄いとして店に共有する場合、その店の承認済みメンバーか検証
  const shopIdRaw = String(formData.get('shop_id') ?? '').trim()
  const shopId = shopIdRaw ? await approvedShopId(supabase, user.id, shopIdRaw) : null

  const row: Record<string, unknown> = {
    user_id: user.id,
    flavor_id: flavorId,
    hms_type: enumOrNull(formData, 'hms_type', HMS_VALUES),
    charcoal_type: enumOrNull(formData, 'charcoal_type', CHARCOAL_VALUES),
    steep_minutes: numOrNull(formData, 'steep_minutes', 0, 30),
    steep_heat: numOrNull(formData, 'steep_heat', 1, 100, true),
    pack_style: enumOrNull(formData, 'pack_style', PACK_VALUES),
    rating: numOrNull(formData, 'rating', 1, 5, true),
    result_note: strOrNull(formData, 'result_note', 500),
    change_note: strOrNull(formData, 'change_note', 300),
    shop_id: shopId,
  }
  const loggedAt = String(formData.get('logged_at') ?? '').trim()
  if (loggedAt) row.logged_at = loggedAt

  const { error } = await supabase.from('flavor_logs').insert(row)
  if (error) return { error: '記録の保存に失敗しました。' }
  revalidatePath(`/flavor/${flavorId}`)
  return { ok: true }
}

/** ベスト設定のトグル（フレーバーごとに1件だけ）。 */
export async function toggleBestLog(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  const flavorId = String(formData.get('flavor_id') ?? '')
  if (!id || !flavorId) return
  const { data: cur } = await supabase.from('flavor_logs').select('is_best').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!cur) return
  const next = !cur.is_best
  if (next) {
    await supabase.from('flavor_logs').update({ is_best: false }).eq('user_id', user.id).eq('flavor_id', flavorId)
  }
  await supabase.from('flavor_logs').update({ is_best: next }).eq('id', id).eq('user_id', user.id)
  revalidatePath(`/flavor/${flavorId}`)
}

/** 公開/非公開のトグル。 */
export async function togglePublicLog(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  const flavorId = String(formData.get('flavor_id') ?? '')
  if (!id || !flavorId) return
  const { data: cur } = await supabase.from('flavor_logs').select('is_public').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!cur) return
  await supabase.from('flavor_logs').update({ is_public: !cur.is_public }).eq('id', id).eq('user_id', user.id)
  revalidatePath(`/flavor/${flavorId}`)
}

/** 公開研究メモへの「参考になった」トグル。 */
export async function toggleLogHelpful(
  logId: number,
  flavorId: string
): Promise<{ helpful: boolean; count: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { data: existing } = await supabase
    .from('flavor_log_helpful')
    .select('log_id')
    .eq('log_id', logId)
    .eq('user_id', user.id)
    .maybeSingle()
  let helpful: boolean
  if (existing) {
    await supabase.from('flavor_log_helpful').delete().eq('log_id', logId).eq('user_id', user.id)
    helpful = false
  } else {
    await supabase.from('flavor_log_helpful').insert({ log_id: logId, user_id: user.id })
    helpful = true
  }
  const { count } = await supabase.from('flavor_log_helpful').select('log_id', { count: 'exact', head: true }).eq('log_id', logId)
  if (flavorId) revalidatePath(`/flavor/${flavorId}`)
  return { helpful, count: count ?? 0 }
}

/** 練習ログを削除する（本人のみ）。 */
export async function deleteFlavorLog(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  const flavorId = String(formData.get('flavor_id') ?? '')
  if (!id) return
  await supabase.from('flavor_logs').delete().eq('id', id).eq('user_id', user.id)
  if (flavorId) revalidatePath(`/flavor/${flavorId}`)
}
