import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getThemeOverview, getThemeComparisonAxes } from '@/lib/queries'
import { FIRST_THEME } from '@/lib/theme'
import { buildDesignSpace, DIFF_AXES } from '@/lib/method-diff'

export const dynamic = 'force-dynamic'
export const metadata = { title: '第一テーマの進捗 — 煙道' }

/**
 * 第一テーマの段階指標（docs/第一テーマ_設計再構成.md §12）。
 * 運営が見るためだけの画面。ここで見る数字をユーザー側の画面に出さないこと
 * （勝率・順位を表に出すと、王道が人気投票になる）。
 */
export default async function AdminThemePage() {
  const user = await getCurrentUser()
  if (!user?.profile?.is_admin) notFound()

  const [{ methods, stats, progress }, cmpAxes] = await Promise.all([
    getThemeOverview(FIRST_THEME.comboKey),
    getThemeComparisonAxes(FIRST_THEME.comboKey),
  ])
  const space = buildDesignSpace(methods)
  const flatAxes = DIFF_AXES.filter((a) => !space.some((s) => s.key === a.key))

  // 決定的な指標は「試した人のうち、比較まで進んだ割合」
  const ratio = progress.participants > 0 ? Math.round((progress.comparers / progress.participants) * 100) : null
  const verdict =
    ratio == null ? null : ratio >= 30 ? '継続' : ratio < 10 ? '撤退先を検討' : '追加検証'

  const rows: { label: string; value: number; note: string }[] = [
    { label: 'L1 参加者', value: progress.participants, note: '他人の作り方を1台以上作った人' },
    { label: 'L2 継続者', value: progress.repeaters, note: 'テーマ内で2台以上作った人' },
    { label: 'L3 複数METHOD', value: progress.multiMethod, note: '異なる2つ以上を作った人' },
    { label: 'L3 比較者', value: progress.comparers, note: '直接比較を記録した人 ★' },
    { label: 'L4 比較件数', value: progress.comparisons, note: '直接比較の総数' },
    { label: '作った総数', value: progress.madeTotal, note: '作者の自作は除く' },
  ]

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 800 }}>第一テーマの進捗</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>{FIRST_THEME.title}</p>

      <section className="card mt-6 p-5">
        <h2 className="text-sm eyebrow">段階指標</h2>
        <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="text-sm" style={{ fontWeight: 700 }}>{r.label}</div>
                <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{r.note}</div>
              </div>
              <div className="text-xl" style={{ fontWeight: 800 }}>{r.value}</div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg p-3" style={{ background: 'var(--accent-tint)' }}>
          <div className="text-sm" style={{ fontWeight: 700 }}>
            比較者 / 参加者 ＝ {ratio == null ? '—' : `${ratio}%`}
            {verdict && <span className="ml-2" style={{ color: 'var(--color-seal)' }}>{verdict}</span>}
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
            30%以上＝コア体験が成立／10%未満＝ユーザーに比較させない形へ縮退。
            20人などの数字は合否ではなく診断値として扱う。
          </p>
        </div>
      </section>

      {/* 地図が潰れていないか＝比較の前提が成立しているか */}
      <section className="card mt-6 p-5">
        <h2 className="text-sm eyebrow">設計空間の散らばり</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          全件が同じ値の軸は比較に使えない。「良い10件」ではなく「散らばった10件」を集める。
        </p>
        {space.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-seal)', fontWeight: 700 }}>
            地図が潰れています。作り方が1件以下か、全件が同じ値です。
          </p>
        ) : (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
            散らばっている軸：{space.map((s) => s.label).join('・')}
            {flatAxes.length > 0 && (
              <>
                <br />
                <span style={{ color: 'var(--color-ash-dim)' }}>
                  差が無い／未記入の軸：{flatAxes.map((a) => a.label).join('・')}
                </span>
              </>
            )}
          </p>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-sm eyebrow">作り方ごとの実績（{methods.length}）</h2>
        {methods.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-ash-dim)' }}>まだ作り方がありません。</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
            {methods.map((m) => {
              const s = stats.get(m.id)
              return (
                <li key={m.id} className="flex items-baseline justify-between gap-3 py-2">
                  <Link href={`/method/${m.id}`} className="min-w-0 truncate text-sm brush-underline">
                    {m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`}
                  </Link>
                  <span className="shrink-0 text-right text-xs" style={{ color: 'var(--color-ash)' }}>
                    再現 {s?.makerCount ?? 0}人 ／ 計 {s?.madeTotal ?? 0} ／ 反復 {s?.repeatMakers ?? 0}人
                    <br />
                    {/* 王道を認定するときに「なぜこれなのか」を説明できる材料。
                        preferred（好まれた回数）はこの運営画面にだけ出す */}
                    <span style={{ color: 'var(--color-ash-dim)' }}>
                      比較 {s?.compared ?? 0}（差あり {s?.differed ?? 0} ／ 同じ {s?.sameCount ?? 0} ／ 好まれた {s?.preferred ?? 0}）
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-sm eyebrow">差はどんな言葉で語られたか</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          比較時に選ばれた語の集計。「分からない」が多いなら、その差は人が知覚できていない可能性がある。
        </p>
        {cmpAxes.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-ash-dim)' }}>まだ比較がありません。</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {cmpAxes.map((a) => (
              <li key={a.axis} className="chip">
                {a.axis} {a.count}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
