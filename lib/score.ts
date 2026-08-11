// 支持スコアの計算式を一元管理する。
// 実地評価（現地で本物を吸った検証済みの票）を最重視する、が全体の設計。

/** ミックスの支持スコア：いいね×1 ＋ 作った×2 ＋ 実地評価×5 */
export function mixSupportScore(likes: number, makes: number, onsite: number): number {
  return likes + makes * 2 + onsite * 5
}

/** お店の支持スコア：実地評価×5 ＋ 所属作り手のいいね ＋ 作った×2 */
export function shopSupportScore(onsite: number, likes: number, makes: number): number {
  return onsite * 5 + likes + makes * 2
}

/** 2点間の距離（メートル / Haversine）。クライアント/サーバー両用。 */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** 距離のわかりやすい表記（m / km）。 */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10}m`
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)}km`
}
