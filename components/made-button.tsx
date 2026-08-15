'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logMadeExperience } from '@/actions/social'
import { trackEvent } from '@/lib/analytics'

/**
 * 「作った」ボタン（experience_type='made'＝この作り方を再現した履歴）。
 * made は履歴なので押しても過去の記録は消さない。取り消しは煙道帳からの明示削除で行う。
 * カウントは「作った人数（ユニーク）」なので、同一ユーザーの2回目以降は増えない。
 */
export function MadeButton({
  mixId,
  initialCount,
  initialMade,
  isAuthed,
}: {
  mixId: string
  initialCount: number
  initialMade: boolean
  isAuthed: boolean
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [made, setMade] = useState(initialMade)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/mix/${mixId}`)
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
        setMade(res.made)
        setCount(res.count)
        // nth はこのユーザー×この mix の「作った」通算（吸ったとは別勘定）
        trackEvent('made', { mix_id: mixId, nth: res.nth })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={made}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
      style={{
        borderColor: made ? 'var(--color-ember)' : 'var(--line-strong)',
        color: made ? 'var(--color-ember-hot)' : 'var(--color-cream)',
        background: made ? 'var(--accent-tint)' : 'transparent',
        fontWeight: 700,
      }}
    >
      <span aria-hidden>🎉</span>
      {made ? 'また作った' : '作った'}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
