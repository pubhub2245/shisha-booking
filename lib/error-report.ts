// 軽量エラーレポーター。
// 本格的な観測 (パンくず, perf, etc.) が必要になったら @sentry/nextjs に置き換える。
// 環境変数:
//   SENTRY_DSN              : 設定されていればその DSN に envelope を送る
//   NEXT_PUBLIC_SENTRY_DSN  : クライアント側 (将来用)

type Context = Record<string, unknown>

export function reportError(err: unknown, context?: Context): void {
  console.error('[error]', err, context ?? {})
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  void sendToSentry(dsn, err, context).catch(() => {})
}

async function sendToSentry(dsn: string, err: unknown, context?: Context) {
  // dsn: https://<key>@<host>/<projectId>
  const m = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn)
  if (!m) return
  const [, publicKey, host, projectId] = m

  const eventId = randomHex(32)
  const timestamp = Date.now() / 1000
  const errorObj = err instanceof Error ? err : new Error(String(err))

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify({
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      level: 'error',
      message: { formatted: errorObj.message },
      exception: {
        values: [
          {
            type: errorObj.name,
            value: errorObj.message,
            stacktrace: errorObj.stack ? { frames: parseStack(errorObj.stack) } : undefined,
          },
        ],
      },
      extra: context,
      tags: { runtime: 'node' },
    }),
  ].join('\n')

  await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${publicKey},sentry_client=shisha-booking/0.1`,
    },
    body: envelope,
  })
}

function parseStack(stack: string) {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => ({ filename: line.trim() }))
    .reverse()
}

function randomHex(len: number): string {
  const bytes = new Uint8Array(len / 2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
