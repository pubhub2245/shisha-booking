// 予約通知モジュール
// 予約成立時に担当エリアのスタッフへ LINE / メールで通知する。
// 環境変数が未設定の場合は該当チャネルをスキップ。
// 通知失敗は予約フローをブロックしない（best-effort）。

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

type NotifyPayload = {
  subject: string
  text: string
}

type Recipient = {
  name: string
  line_user_id: string | null
  email: string | null
}

// ---------------------------------------------------------------------------
// エリアで受信者を取得
// ---------------------------------------------------------------------------

export async function getRecipientsByArea(area: string): Promise<Recipient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notification_recipients')
    .select('name, line_user_id, email')
    .eq('is_active', true)
    .contains('area_labels', [area])
  if (error) {
    console.error('[getRecipientsByArea] error:', error)
    return []
  }
  return (data as Recipient[]) || []
}

// ---------------------------------------------------------------------------
// LINE Push API
// ---------------------------------------------------------------------------

const LINE_API = 'https://api.line.me/v2/bot/message/push'

async function sendLinePush(lineUserId: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  const res = await fetch(LINE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })
  if (!res.ok) {
    console.error('[sendLinePush] LINE API error:', res.status, await res.text())
  }
}

// ---------------------------------------------------------------------------
// Resend メール
// ---------------------------------------------------------------------------

const RESEND_API = 'https://api.resend.com/emails'

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const from = process.env.NOTIFICATION_FROM_EMAIL || 'onboarding@resend.dev'

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  })
  if (!res.ok) {
    console.error('[sendEmail] Resend error:', res.status, await res.text())
  }
}

// ---------------------------------------------------------------------------
// 管理者通知（後方互換 — 既存の ADMIN_NOTIFY_EMAIL 宛て）
// ---------------------------------------------------------------------------

export async function notifyAdmin(payload: NotifyPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ADMIN_NOTIFY_EMAIL
  const from = process.env.RESEND_FROM_EMAIL || process.env.NOTIFICATION_FROM_EMAIL || 'noreply@example.com'

  if (!apiKey || !to) return

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject: payload.subject, text: payload.text }),
    })
    if (!res.ok) {
      console.error('[notifyAdmin] resend error:', res.status, await res.text())
    }
  } catch (e) {
    console.error('[notifyAdmin] exception:', e)
  }
}

// ---------------------------------------------------------------------------
// エリアスタッフへ通知（LINE + メール）
// ---------------------------------------------------------------------------

export async function notifyAreaStaff(area: string, payload: NotifyPayload): Promise<void> {
  const recipients = await getRecipientsByArea(area)
  if (recipients.length === 0) return

  const tasks: Promise<void>[] = []

  for (const r of recipients) {
    if (r.line_user_id) {
      tasks.push(
        sendLinePush(r.line_user_id, `${payload.subject}\n\n${payload.text}`).catch((e) =>
          console.error(`[notifyAreaStaff] LINE failed for ${r.name}:`, e)
        )
      )
    }
    if (r.email) {
      tasks.push(
        sendEmail(r.email, payload.subject, payload.text).catch((e) =>
          console.error(`[notifyAreaStaff] Email failed for ${r.name}:`, e)
        )
      )
    }
  }

  await Promise.allSettled(tasks)
}

// ---------------------------------------------------------------------------
// メッセージテンプレート
// ---------------------------------------------------------------------------

export function reservationCreatedMessage(input: {
  name: string
  phone: string
  area: string
  date: string
  time: string
  location: string
  quantity: number
}): NotifyPayload {
  return {
    subject: `【新規予約】${input.date} ${input.time} ${input.area}`,
    text: [
      '新しい予約が入りました。',
      '',
      `お名前: ${input.name}`,
      `電話: ${input.phone}`,
      `エリア: ${input.area}`,
      `日時: ${input.date} ${input.time}`,
      `場所: ${input.location}`,
      `台数: ${input.quantity}`,
    ].join('\n'),
  }
}

export function reservationCancelledMessage(input: {
  date: string
  time: string
  area: string
}): NotifyPayload {
  return {
    subject: `【キャンセル】${input.date} ${input.time} ${input.area}`,
    text: `予約がキャンセルされました。\n日時: ${input.date} ${input.time}\nエリア: ${input.area}`,
  }
}
