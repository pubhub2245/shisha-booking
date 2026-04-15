// JST 固定で日付処理を行う共通ユーティリティ。
// new Date() はクライアント環境のローカルタイムに依存するので、
// 営業時間/予約日付はすべてここを通して JST に揃える。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function nowInJst(): Date {
  return new Date(Date.now() + JST_OFFSET_MS)
}

export function jstTodayStr(): string {
  const d = nowInJst()
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function jstNowMinutes(): number {
  const d = nowInJst()
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

// reservation_date(YYYY-MM-DD) + reservation_time(HH:MM) を JST として解釈し UTC Date を返す
export function reservationDateTimeInJst(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  // JST -> UTC: -9h
  return new Date(Date.UTC(y, mo - 1, d, h - 9, mi, 0, 0))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
