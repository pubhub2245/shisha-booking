'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logSmoke, setExperienceVerdict } from '@/actions/social'
import { TasteInput } from '@/components/taste-input'
import { trackEvent, type Verdict } from '@/lib/analytics'

const VERDICTS: { key: Verdict; label: string }[] = [
  { key: 'again', label: 'また吸いたい' },
  { key: 'good', label: 'おいしかった' },
  { key: 'ok', label: 'ふつう' },
  { key: 'not_for_me', label: '好みではなかった' },
]

/**
 * 「吸った」最小フロー。
 * 吸った → 記録（追記型・何度でも可）→「どうだった？」4択で満足度(verdict)を任意で残す。
 * 味の印象（5軸）は任意の追加導線として最後に置く（最小フローは重くしない）。
 */
export function SmokedButton({
  mixId,
  isAuthed,
  initialCount,
  initialMine,
  initialMyId,
  initialVerdict,
}: {
  mixId: string
  isAuthed: boolean
  initialCount: number
  initialMine: boolean
  initialMyId: string | null
  initialVerdict: Verdict | null
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [logged, setLogged] = useState(initialMine)
  const [expId, setExpId] = useState<string | null>(initialMyId)
  const [verdict, setVerdict] = useState<Verdict | null>(initialVerdict)
  const [pending, startTransition] = useTransition()
  const [savingVerdict, setSavingVerdict] = useState<Verdict | null>(null)

  function onSmoke() {
    if (!isAuthed) {
      router.push(`/login?next=/mix/${mixId}`)
      return
    }
    // 楽観更新
    setLogged(true)
    setCount((c) => c + 1)
    startTransition(async () => {
      const res = await logSmoke(mixId)
      if ('error' in res) {
        setLogged(initialMine)
        setCount((c) => c - 1)
      } else {
        setExpId(res.id)
        setCount(res.count)
        setVerdict(null)
        // nth はこのユーザー×この mix の「吸った」通算（作ったとは別勘定）
        trackEvent('smoked', { mix_id: mixId, nth: res.nth })
      }
    })
  }

  function onVerdict(v: Verdict) {
    if (!expId) return
    const prev = verdict
    setVerdict(v)
    setSavingVerdict(v)
    startTransition(async () => {
      const res = await setExperienceVerdict(expId, v)
      setSavingVerdict(null)
      if ('error' in res) setVerdict(prev)
      else trackEvent('verdict_set', { mix_id: mixId, verdict: v })
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onSmoke}
        disabled={pending}
        aria-pressed={logged}
        // コアループの主役。ページ内で最も強い塗りのアクションにする。
        className="inline-flex items-center gap-1.5 self-start rounded-full border px-4 py-2 text-sm transition-colors"
        style={{
          borderColor: 'var(--color-seal)',
          background: logged ? 'transparent' : 'var(--color-seal)',
          color: logged ? 'var(--color-seal)' : '#fbf8f0',
          fontWeight: 800,
        }}
      >
        <span aria-hidden style={{ fontSize: '0.9em' }}>◦</span>
        {logged ? 'また吸った' : '吸った'}
        {count > 0 && <span>{count}</span>}
      </button>

      {logged && expId && (
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
                  disabled={savingVerdict !== null}
                  aria-pressed={active}
                  className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                  style={{
                    borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                    color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
                    background: active ? 'var(--accent-tint, transparent)' : 'transparent',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
          {/* 味の印象（5軸）は任意。最小フローは「吸った→どうだった？」のまま重くしない */}
          <TasteInput experienceId={expId} mixId={mixId} />
        </div>
      )}
    </div>
  )
}
