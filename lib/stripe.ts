import Stripe from 'stripe'

/** Stripe が設定済みか（キー未設定なら決済機能は眠ったまま） */
export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

let _stripe: Stripe | null = null

/** Stripe クライアント（未設定なら null） */
export function getStripe(): Stripe | null {
  if (!stripeConfigured()) return null
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
  return _stripe
}
