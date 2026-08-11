'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OnsiteResult =
  | { status: 'recorded' | 'already'; shopName: string; count: number }
  | { status: 'too_far'; shopName: string; distance: number; radius: number }
  | { status: 'no_shop' | 'own_mix' | 'not_authed' | 'not_found' | 'error' }

/**
 * 実地評価を記録する。端末から取得したGPS座標をサーバー側(SECURITY DEFINER関数)へ渡し、
 * 「投稿者のお店の登録位置に近接しているか」を検証。近接していれば1回だけ記録する。
 * 検証・重複防止はすべてDB関数側で行うため、クライアントからの座標詐称以外は防げる
 * （座標詐称は端末GPSの範囲。QRだけの遠隔投票を防ぐのが主目的）。
 */
export async function submitOnsiteRating(mixId: string, lat: number, lng: number): Promise<OnsiteResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { status: 'error' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { status: 'not_authed' }

  const { data, error } = await supabase.rpc('record_onsite_rating', {
    p_mix_id: mixId,
    p_lat: lat,
    p_lng: lng,
  })
  if (error) return { status: 'error' }

  const r = (data ?? {}) as {
    status?: string
    shop_name?: string
    distance_m?: number
    radius_m?: number
    count?: number
  }
  switch (r.status) {
    case 'recorded':
    case 'already':
      revalidatePath(`/mix/${mixId}`)
      revalidatePath('/national')
      return { status: r.status, shopName: r.shop_name ?? '', count: r.count ?? 0 }
    case 'too_far':
      return { status: 'too_far', shopName: r.shop_name ?? '', distance: r.distance_m ?? 0, radius: r.radius_m ?? 0 }
    case 'no_shop':
    case 'own_mix':
    case 'not_authed':
    case 'not_found':
      return { status: r.status }
    default:
      return { status: 'error' }
  }
}
