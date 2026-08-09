'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleLogHelpful } from '@/actions/flavor-log'

/** 公開研究メモの「👍 参考になった」ボタン（楽観更新）。 */
export function LogHelpfulButton({
  logId,
  flavorId,
  initialCount,
  initialHelpful,
  isAuthed,
}: {
  logId: number
  flavorId: string
  initialCount: number
  initialHelpful: boolean
  isAuthed: boolean
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [helpful, setHelpful] = useState(initialHelpful)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/flavor/${flavorId}`)
      return
    }
    const next = !helpful
    setHelpful(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const res = await toggleLogHelpful(logId, flavorId)
      if ('error' in res) {
        setHelpful(!next)
        setCount((c) => c + (next ? -1 : 1))
      } else {
        setHelpful(res.helpful)
        setCount(res.count)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={helpful}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
      style={{
        borderColor: helpful ? 'var(--color-ember)' : 'var(--line-strong)',
        color: helpful ? 'var(--color-ember-hot)' : 'var(--color-ash)',
        background: helpful ? 'var(--accent-tint)' : 'transparent',
        fontWeight: 600,
      }}
    >
      👍 参考になった{count > 0 && ` ${count}`}
    </button>
  )
}
