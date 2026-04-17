// LINE Webhook エンドポイント
// 友だち追加(follow)やメッセージ受信時に User ID を line_webhook_users に保存する。
// LINE の署名検証を行い、不正なリクエストを拒否する。

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// --- 署名検証 -----------------------------------------------------------

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return expected === signature
}

// --- LINE プロフィール取得 -----------------------------------------------

async function getLineProfile(userId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.displayName ?? null
  } catch {
    return null
  }
}

// --- supabase (service role — RLS バイパス) ------------------------------

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

// --- Webhook ハンドラ ----------------------------------------------------

export async function POST(req: NextRequest) {
  // LINE Channel Secret が未設定なら 500
  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) {
    console.error('[LINE Webhook] LINE_CHANNEL_SECRET not configured')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  // 署名検証
  const signature = req.headers.get('x-line-signature') ?? ''
  const rawBody = await req.text()

  const valid = await verifySignature(rawBody, signature, channelSecret)
  if (!valid) {
    console.warn('[LINE Webhook] Invalid signature')
    return NextResponse.json({ error: 'invalid signature' }, { status: 403 })
  }

  // イベント解析
  let body: { events?: Array<{ type: string; source?: { userId?: string }; message?: { type: string; text?: string } }> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const events = body.events ?? []
  const supabase = getSupabaseAdmin()
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''

  for (const event of events) {
    const userId = event.source?.userId
    if (!userId) continue

    // follow (友だち追加) または message イベントのみ処理
    if (event.type !== 'follow' && event.type !== 'message') continue

    // 表示名を取得
    const displayName = accessToken ? await getLineProfile(userId, accessToken) : null

    // メッセージテキスト（あれば）
    const messageText = event.type === 'message' && event.message?.type === 'text'
      ? event.message.text ?? null
      : null

    // upsert — 既に存在する場合は表示名・メッセージを更新
    const { error } = await supabase
      .from('line_webhook_users')
      .upsert(
        {
          line_user_id: userId,
          display_name: displayName,
          message: messageText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'line_user_id' },
      )

    if (error) {
      console.error('[LINE Webhook] upsert error:', error)
    }
  }

  // LINE プラットフォームには必ず 200 を返す
  return NextResponse.json({ ok: true })
}
