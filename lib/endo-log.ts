/**
 * 煙道帳の「N回目」の算出。
 *
 * 通算は experience の種別ごとに分ける：
 *   - smoked の「N回目」… そのユーザー×mix の smoked だけで通算
 *   - made   の「N回目」… そのユーザー×mix の made   だけで通算
 * 例）吸った2回・作った1回 → 2回目の smoked は「吸った 2回目」、made は「作った 1回目」。
 *
 * ※ 今月サマリーの「吸った」は別仕様で smoked + made（made も「自分で作って吸った」体験）。
 *    ここを揃えてはいけない。
 */
export type ExperienceRow = {
  id: string
  mix_id: string
  experience_type: 'smoked' | 'made'
  occurred_at: string
}

/** experience id → その mix × その種別で何回目か（古い順に1始まり） */
export function buildNthMap(rows: ExperienceRow[]): Map<string, number> {
  const byMixKind = new Map<string, { id: string; occurred_at: string }[]>()
  for (const r of rows) {
    const key = `${r.mix_id}::${r.experience_type}`
    const arr = byMixKind.get(key) ?? []
    arr.push({ id: r.id, occurred_at: r.occurred_at })
    byMixKind.set(key, arr)
  }

  const nthById = new Map<string, number>()
  for (const arr of byMixKind.values()) {
    // 同時刻が並んだときも順序が揺れないよう、occurred_at → id の順で安定化する
    arr.sort((a, b) =>
      a.occurred_at === b.occurred_at
        ? a.id < b.id
          ? -1
          : 1
        : a.occurred_at < b.occurred_at
          ? -1
          : 1
    )
    arr.forEach((r, i) => nthById.set(r.id, i + 1))
  }
  return nthById
}
