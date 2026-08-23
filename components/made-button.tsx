'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logMadeExperience, setExperienceVerdict, setExperienceComparison } from '@/actions/social'
import { TasteInput } from '@/components/taste-input'
import { COMPARISON_AXES } from '@/lib/taste'
import { trackEvent, type Verdict } from '@/lib/analytics'

const VERDICTS: { key: Verdict; label: string }[] = [
  { key: 'again', label: 'また作りたい' },
  { key: 'good', label: 'おいしかった' },
  { key: 'ok', label: 'ふつう' },
  { key: 'not_for_me', label: '好みではなかった' },
]

/** 直接比較。「同じくらい」を必ず選べるようにする（差が出なかったことも記録に値する） */
const COMPARISONS: { key: 'better' | 'same' | 'worse'; label: (a: string, b: string) => string }[] = [
  { key: 'better', label: (a) => `${a} の方が好き` },
  { key: 'same', label: () => '同じくらい' },
  { key: 'worse', label: (_a, b) => `${b} の方が好き` },
]

/** 同じフレーバーの中での文脈。作り方のページから渡す */
export type MethodContext = {
  /** 自分が前に作った別の作り方。これがあると直接比較を聞ける */
  baseline: { mixId: string; label: string } | null
  /** 次に試すと差が分かりやすい作り方。宿題ではなく招待として出す */
  next: { id: string; label: string; diff: string; meaning: string | null } | null
  /** そのフレーバーのページ */
  flavorPath: string
  flavorTitle: string
}

/**
 * 「作った」＝この作り方を実際に一台つくった記録。
 *
 * 記録して「保存しました」で終わらせない。押したあとに必ず何かを返す：
 *   1. どうだった？（4択・任意）
 *   2. 前に作った別の作り方との直接比較（テーマ内で2台目以降のときだけ）
 *   3. 味の印象5軸（任意）
 *   4. 次に試すと差が分かりやすい作り方（招待。作れとは言わない）
 *
 * made は履歴なので、押しても過去の記録は消さない。取り消しは煙道帳からの明示削除で行う。
 */
export function MadeButton({
  mixId,
  mixLabel,
  initialCount,
  initialMade,
  isAuthed,
  context,
}: {
  mixId: string
  /** 比較の文面に出す、この作り方の呼び名 */
  mixLabel: string
  initialCount: number
  initialMade: boolean
  isAuthed: boolean
  context?: MethodContext
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [made, setMade] = useState(initialMade)
  const [expId, setExpId] = useState<string | null>(null)
  const [nth, setNth] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [comparison, setComparison] = useState<'better' | 'same' | 'worse' | null>(null)
  const [axes, setAxes] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/method/${mixId}`)
      return
    }
    const wasMade = made
    // 楽観更新：初回のみ人数が増える
    setMade(true)
    if (!wasMade) setCount((c) => c + 1)
    startTransition(async () => {
      const res = await logMadeExperience(mixId)
      if ('error' in res) {
        setMade(wasMade)
        if (!wasMade) setCount((c) => c - 1)
      } else {
        setExpId(res.id)
        setMade(res.made)
        setCount(res.count)
        setNth(res.nth)
        setVerdict(null)
        setComparison(null)
        setAxes([])
        // nth はこのユーザー×この mix の「作った」通算（吸ったとは別勘定）
        trackEvent('made', { mix_id: mixId, nth: res.nth })
      }
    })
  }

  function onVerdict(v: Verdict) {
    if (!expId) return
    const prev = verdict
    setVerdict(v)
    startTransition(async () => {
      const res = await setExperienceVerdict(expId, v)
      if ('error' in res) setVerdict(prev)
      else trackEvent('verdict_set', { mix_id: mixId, verdict: v })
    })
  }

  function saveComparison(next: 'better' | 'same' | 'worse', nextAxes: string[]) {
    const base = context?.baseline
    if (!expId || !base) return
    startTransition(async () => {
      const res = await setExperienceComparison(expId, base.mixId, next, nextAxes)
      if (!('error' in res)) {
        trackEvent('comparison_set', { mix_id: mixId, comparison: next, axes: nextAxes.length })
      }
    })
  }

  function onComparison(v: 'better' | 'same' | 'worse') {
    setComparison(v)
    saveComparison(v, axes)
  }

  function toggleAxis(a: string) {
    const next = axes.includes(a) ? axes.filter((x) => x !== a) : [...axes, a]
    setAxes(next)
    if (comparison) saveComparison(comparison, next)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={made}
        className="inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: made ? 'var(--color-ember)' : 'var(--line-strong)',
          color: made ? 'var(--color-ember-hot)' : 'var(--color-cream)',
          background: made ? 'var(--accent-tint)' : 'transparent',
          fontWeight: 700,
        }}
      > {made ? 'また作った' : 'この作り方で作った'}
        {count > 0 && <span>{count}</span>}
      </button>

      {/* ---- 記録したあとに返すもの。ここが空だと2台目は起きない ---- */}
      {expId && (
        <div className="mt-1 flex flex-col gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
          {nth != null && (
            <p className="text-xs" style={{ color: 'var(--color-ash)' }}>
              記録しました{nth > 1 && <>（この作り方は {nth} 回目）</>}。
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>どうだった？（任意）</span>
            <div className="flex flex-wrap gap-1.5">
              {VERDICTS.map((v) => {
                const active = verdict === v.key
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => onVerdict(v.key)}
                    aria-pressed={active}
                    className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                    style={{
                      borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                      color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
                      background: active ? 'var(--accent-tint)' : 'transparent',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---- 直接比較。前に別の作り方を作っているときだけ聞く ---- */}
          {context?.baseline && (
            <div className="flex flex-col gap-1.5 rounded-lg p-2.5" style={{ background: 'var(--accent-tint)' }}>
              <span className="text-xs" style={{ color: 'var(--color-ash)', fontWeight: 700 }}>
                前に作った「{context.baseline.label}」と比べて、どうでしたか？
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMPARISONS.map((c) => {
                  const active = comparison === c.key
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => onComparison(c.key)}
                      aria-pressed={active}
                      className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                      style={{
                        borderColor: active ? 'var(--color-seal)' : 'var(--line)',
                        color: active ? 'var(--color-seal)' : 'var(--color-ash)',
                        background: active ? 'var(--paper)' : 'transparent',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {c.label(mixLabel, context.baseline!.label)}
                    </button>
                  )
                })}
              </div>

              {comparison && (
                <>
                  <span className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    どこが違いましたか？（任意・複数可）
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPARISON_AXES.map((a) => {
                      const active = axes.includes(a)
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAxis(a)}
                          aria-pressed={active}
                          className="rounded-full border px-2 py-0.5 text-xs transition-colors"
                          style={{
                            borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                            color: active ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)',
                            background: active ? 'var(--paper)' : 'transparent',
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {a}
                        </button>
                      )
                    })}
                  </div>
                  {comparison === 'same' && (
                    // 差が出なかったことを失敗として返さない。ここで体験を終わらせない。
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
                      違いが分からなかったことも、立派な記録です。この差では、あなたには差が出ないと分かりました。
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* 味の印象（5軸）は任意。比較の成立条件にはしない */}
          <TasteInput experienceId={expId} mixId={mixId} />

          {/* ---- 次の1台。作れとは言わない ---- */}
          {context?.next && (
            <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>気が向いたときに</span>
              <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
                <span style={{ fontWeight: 700 }}>{context.next.label}</span> は、いま作った一台と
                <span style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}> {context.next.diff}</span>
                {context.next.meaning ? `。${context.next.meaning}。` : '。'}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link href={`/method/${context.next.id}`} className="text-sm brush-underline" style={{ fontWeight: 700 }}>
                  見てみる
                </Link>
                <Link href={context.flavorPath} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                  {context.flavorTitle}へ
                </Link>
              </div>
              <p className="text-[0.7rem]" style={{ color: 'var(--color-ash-dim)' }}>
                次にシーシャを作るときで大丈夫です。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
