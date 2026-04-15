import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

// クライアント側のログインフォームから呼び出されるレート制限チェック。
// 認証前に走るため anon クライアントを使い、
// SECURITY DEFINER の RPC 経由で login_attempts に記録する。
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const supabase = createPublicClient()
  const { data, error } = await supabase.rpc('check_login_rate_limit', {
    p_ip: ip,
    p_email: body.email ?? null,
  })

  if (error) {
    console.error('[login-rate-check]', error)
    // フェイルオープン: DB 側のエラーでログインを止めない
    return NextResponse.json({ allowed: true })
  }

  const result = data as { allowed: boolean; retry_after_seconds?: number } | null
  return NextResponse.json(result || { allowed: true })
}
