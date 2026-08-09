/** ISO 日時が指定日数より古いか（サーバー側で評価） */
export function isOlderThanDays(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return false
  return Date.now() - then > days * 86400000
}

/** ISO 日時を「◯分前」等の相対表現に（サーバー側で評価） */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}日前`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}ヶ月前`
  return `${Math.floor(mo / 12)}年前`
}
