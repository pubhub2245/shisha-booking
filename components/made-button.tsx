'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleMade } from '@/actions/social'

/** 「作った！」ボタン（楽観更新）。 */
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
    const next = !made
    setMade(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const res = await toggleMade(mixId)
      if ('error' in res) {
        setMade(!next)
        setCount((c) => c + (next ? -1 : 1))
      } else {
        setMade(res.made)
        setCount(res.count)
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
        color: made ? 'var(--color-ember-hot)' : 'var(--color-ash)',
        background: made ? 'var(--accent-tint)' : 'transparent',
        fontWeight: 600,
      }}
    >
      <span aria-hidden>🎉</span>
      {made ? '作った！' : '作った'}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
