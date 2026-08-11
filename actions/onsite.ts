'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CheckinResult =
  | { status: 'checked_in' | 'already'; shopName?: string; availableAt: string }
  | { status: 'too_far'; shopName: string; distance: number; radius: number }
  | { status: 'no_shop' | 'own_mix' | 'not_authed' | 'not_found' | 'error' }

export type RateResult =
  | { status: 'rated'; count: number }
  | { status: 'too_early'; availableAt: string }
  | { status: 'not_checked_in' | 'already' | 'bad_score' | 'not_authed' | 'error' }

/**
 * 来店チェックイン。端末GPS座標をサーバー側(SECURITY DEFINER)へ渡し、
 * 「投稿者のお店の登録位置に近接しているか」を検証して"その場にいた"ことだけを記録する。
 * 実際の採点はこの24時間後から（onsite_rate）。
 */
export async function submitOnsiteCheckin(mixId: string, lat: number, lng: number): Promise<CheckinResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { status: 'error' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { status: 'not_authed' }

  const { data, error } = await supabase.rpc('onsite_checkin', { p_mix_id: mixId, p_lat: lat, p_lng: lng })
  if (error) return { status: 'error' }

  const r = (data ?? {}) as {
    status?: string
    shop_name?: string
    distance_m?: number
    radius_m?: number
    available_at?: string
  }
  switch (r.status) {
    case 'checked_in':
    case 'already':
      revalidatePath(`/mix/${mixId}`)
      return { status: r.status, shopName: r.shop_name, availableAt: r.available_at ?? '' }
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

/**
 * 採点（チェックインの24時間後から・場所を問わない）。1〜5の星＋任意コメント。
 */
export async function submitOnsiteRating(mixId: string, score: number, comment: string): Promise<RateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { status: 'not_authed' }
  if (!Number.isInteger(score) || score < 1 || score > 5) return { status: 'bad_score' }

  const { data, error } = await supabase.rpc('onsite_rate', {
    p_mix_id: mixId,
    p_score: score,
    p_comment: comment?.slice(0, 300) ?? null,
  })
  if (error) return { status: 'error' }

  const r = (data ?? {}) as { status?: string; available_at?: string; count?: number }
  switch (r.status) {
    case 'rated':
      revalidatePath(`/mix/${mixId}`)
      revalidatePath('/national')
      revalidatePath('/areas')
      return { status: 'rated', count: r.count ?? 0 }
    case 'too_early':
      return { status: 'too_early', availableAt: r.available_at ?? '' }
    case 'not_checked_in':
    case 'already':
    case 'bad_score':
    case 'not_authed':
      return { status: r.status }
    default:
      return { status: 'error' }
  }
}
