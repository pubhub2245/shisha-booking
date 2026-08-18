import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import {
  getSmokeLog,
  getBookmarkedMixes,
  getThemeOverview,
  getMyThemeMade,
  getMyThemeComparisons,
} from '@/lib/queries'
import { FIRST_THEME, THEME_PATH } from '@/lib/theme'
import { rankNextCandidates, describeDiff, diffMethods, nextExperimentPolicy } from '@/lib/method-diff'
import { flavorLine } from '@/lib/mix'
import { formatJaDate } from '@/lib/time'
import type { MixWithRelations } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '今日の一台を記録 — 煙道' }

const label = (m: { id: string; title: string | null; mix_flavors?: { name: string }[] | null }) =>
  flavorLine(m.mix_flavors) || m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`

/** 記録そのものは作り方のページで行う。ここはその入口を1枚に集めた場所。 */
function MethodRow({
  mix,
  note,
  accent,
}: {
  mix: MixWithRelations
  note?: string | null
  accent?: boolean
}) {
  return (
    <Link
      href={`/method/${mix.id}`}
      className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors"
      style={{ borderColor: accent ? 'var(--color-ember)' : 'var(--line)' }}
    >
      <span className="truncate text-sm" style={{ fontWeight: 700 }}>{label(mix)}</span>
      {note && (
        <span className="text-xs" style={{ color: accent ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)', fontWeight: accent ? 600 : 400 }}>
          {note}
        </span>
      )}
    </Link>
  )
}

/**
 * 「今日の一台を記録する」入口。
 *
 * 煙道の主行動は自分の作り方を投稿することではなく、他人の作り方を試して残すこと。
 * これまで記録は作り方ページに辿り着かないと始められなかったので、その入口をここに集めた。
 * 記録の UI 自体は二重に持たない（作り方ページの「作った／吸った」が唯一の記録面）。
 */
export default async function RecordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/record')

  const [log, bookmarked, themeOverview, themeMade, themeComparisons] = await Promise.all([
    getSmokeLog(20),
    getBookmarkedMixes(),
    getThemeOverview(FIRST_THEME.comboKey),
    getMyThemeMade(FIRST_THEME.comboKey),
    getMyThemeComparisons(FIRST_THEME.comboKey),
  ])

  // 今月の検証：最後に作った一台から差が小さい「次の1台」。
  // 比較まで進んでいるなら、その結論（差が出た／出なかった）を次の候補に効かせる。
  const madeIds = new Set(themeMade.map((r) => r.mixId))
  const latest = themeMade[0] ? themeOverview.methods.find((m) => m.id === themeMade[0].mixId) ?? null : null
  const lastCmp = themeComparisons[0] ?? null
  const lastSubject = lastCmp ? themeOverview.methods.find((m) => m.id === lastCmp.mixId) ?? null : null
  const lastObject = lastCmp ? themeOverview.methods.find((m) => m.id === lastCmp.comparedToMixId) ?? null : null
  const policy =
    lastCmp && lastSubject && lastObject
      ? nextExperimentPolicy(lastCmp.comparison === 'same' ? 'same' : 'better', diffMethods(lastObject, lastSubject))
      : null
  const base = policy ? lastSubject : latest
  const next = base
    ? rankNextCandidates(base, themeOverview.methods, {
        madeIds,
        makerCount: (id) => themeOverview.stats.get(id)?.makerCount ?? 0,
        preferAxes: policy?.preferAxes,
        avoidAxes: policy?.avoidAxes,
      }).find((c) => !madeIds.has(c.method.id))
    : undefined
  // まだテーマに参加していない人には、検証対象の入口だけ出す
  const themeStart = !latest ? themeOverview.methods[0] ?? null : null

  // 直近に触った作り方（同じ作り方は1回だけ出す）
  const recent: { mix: MixWithRelations; at: string; kind: string }[] = []
  const seen = new Set<string>()
  for (const e of log.entries) {
    if (seen.has(e.mix.id)) continue
    seen.add(e.mix.id)
    recent.push({ mix: e.mix, at: e.at, kind: e.kind === 'made' ? '作った' : '吸った' })
    if (recent.length >= 5) break
  }

  const saved = bookmarked.filter((m) => !seen.has(m.id)).slice(0, 5)

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>今日の一台を記録</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
        作り方を開いて「作った」を押すだけです。
      </p>

      {/* ---------- 今月の検証：次の1台 ---------- */}
      <section className="card mt-6 p-5">
        <p className="eyebrow">今月の煙道検証</p>
        {next ? (
          <>
            {policy ? (
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                <span style={{ fontWeight: 700 }}>{policy.finding}</span>
                {policy.suggestion}
              </p>
            ) : (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
                あなたはこのテーマで {themeMade.length} 通り試しています。
              </p>
            )}
            <div className="mt-3">
              <MethodRow mix={next.method} note={next.diffs.map(describeDiff).join('／')} accent />
            </div>
          </>
        ) : themeStart ? (
          <>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              {FIRST_THEME.title}。いつもの一台を、誰かのやり方に置き換えてみる。
            </p>
            <div className="mt-3">
              <MethodRow mix={themeStart} note="この作り方から始められます" accent />
            </div>
          </>
        ) : (
          // 検証テーマにまだ作り方が1つも無い状態。ここを空欄で消すと「記録する場所」が無くなる
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            {FIRST_THEME.title} には、まだ作り方が1つもありません。
            <br />
            比べるには2通り以上が要ります。まずは、いつも作っている作り方をそのまま残してください。
          </p>
        )}
        <Link href={THEME_PATH} className="mt-2 inline-block text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          検証のページへ →
        </Link>
      </section>

      {/* ---------- 直近に作った・吸った ---------- */}
      <section className="mt-8">
        <h2 className="text-sm eyebrow">直近に作った・吸った</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>まだ記録がありません。</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {recent.map((r) => (
              <MethodRow key={r.mix.id} mix={r.mix} note={`${formatJaDate(r.at)} に${r.kind}`} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- 保存した作り方 ---------- */}
      {saved.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm eyebrow">保存した作り方</h2>
          <div className="mt-3 flex flex-col gap-2">
            {saved.map((m) => (
              <MethodRow key={m.id} mix={m} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- 探す・登録する（主導線にしない） ---------- */}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/search" className="text-sm brush-underline" style={{ fontWeight: 600 }}>
          作り方を探す
        </Link>
        <Link href="/post" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          自分の作り方を登録する
        </Link>
      </div>
    </div>
  )
}
