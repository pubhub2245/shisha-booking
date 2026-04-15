// 予約通知の最小実装。
// 環境変数 RESEND_API_KEY と ADMIN_NOTIFY_EMAIL がある場合のみ送信する。
// 未設定環境では何もせず success として返す (本番にデプロイ後に設定すれば即時有効化)。

type NotifyPayload = {
  subject: string
  text: string
}

const RESEND_API = 'https://api.resend.com/emails'

export async function notifyAdmin(payload: NotifyPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ADMIN_NOTIFY_EMAIL
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'

  if (!apiKey || !to) return

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.subject,
        text: payload.text,
      }),
    })
    if (!res.ok) {
      console.error('[notifyAdmin] resend error:', res.status, await res.text())
    }
  } catch (e) {
    console.error('[notifyAdmin] exception:', e)
  }
}

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
