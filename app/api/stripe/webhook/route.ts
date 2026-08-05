import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Stripe 決済完了 Webhook。checkout.session.completed で mix_unlocks を付与する。
 * 署名検証には STRIPE_WEBHOOK_SECRET、解錠付与には SUPABASE_SERVICE_ROLE_KEY が必要。
 */
export async function POST(request: NextRequest): Promise<Response> {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return NextResponse.json({ error: 'not configured' }, { status: 400 })

  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'no signature' }, { status: 400 })

  const body = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const mixId = session.metadata?.mix_id
    const userId = session.metadata?.user_id
    if (mixId && userId) {
      const admin = createAdminClient()
      if (admin) {
        await admin
          .from('mix_unlocks')
          .upsert({ mix_id: mixId, user_id: userId }, { onConflict: 'mix_id,user_id', ignoreDuplicates: true })
      }
    }
  }

  return NextResponse.json({ received: true })
}
