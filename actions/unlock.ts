'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripe, stripeConfigured } from '@/lib/stripe'
import { normalizePrice } from '@/lib/premium'

/**
 * 有料ノートの解錠。
 * - Stripe 未設定：スタブ（近日対応）。
 * - Stripe 設定済み：Checkout セッションを作成し、その URL を返す。
 *   決済完了は /api/stripe/webhook が受け取り、mix_unlocks を付与する。
 */
export async function unlockMix(mixId: string): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: mix } = await supabase
    .from('mixes')
    .select('id, title, premium, price')
    .eq('id', mixId)
    .maybeSingle()
  const m = mix as { id: string; title: string; premium?: boolean; price?: number | null } | null
  if (!m || !m.premium) return { error: 'この作り方は有料ノートではありません。' }

  // 既に解錠済みなら課金不要
  const { data: existing } = await supabase
    .from('mix_unlocks')
    .select('mix_id')
    .eq('mix_id', mixId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return { error: 'すでに解錠済みです。ページを再読み込みしてください。' }

  const price = normalizePrice(m.price)
  if (!stripeConfigured() || !price) {
    return { error: '決済機能は近日対応予定です。もう少しお待ちください。' }
  }

  const stripe = getStripe()
  if (!stripe) return { error: '決済機能は近日対応予定です。もう少しお待ちください。' }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'jpy',
            unit_amount: price,
            product_data: { name: `有料ノート：${m.title}` },
          },
        },
      ],
      metadata: { mix_id: m.id, user_id: user.id },
      customer_email: user.email ?? undefined,
      success_url: `${origin}/mix/${m.id}?unlocked=1`,
      cancel_url: `${origin}/mix/${m.id}`,
    })
    if (!session.url) return { error: '決済の開始に失敗しました。' }
    return { url: session.url }
  } catch (e) {
    console.error('[unlockMix] stripe', e)
    return { error: '決済の開始に失敗しました。時間をおいて再度お試しください。' }
  }
}
