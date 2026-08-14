'use client'

import { useState, useTransition } from 'react'
import { recommendMethod, unrecommendMethod } from '@/actions/orthodoxy'

/**
 * 「この作り方を推薦する」（運営・認証プロのみ表示）。
 * 推薦は公式王道の認定とは別概念。認定は運営が管理画面で行う。
 */
export function RecommendButton({
  mixId,
  initialRecommended,
  initialCount,
}: {
  mixId: string
  initialRecommended: boolean
  initialCount: number
}) {
  const [recommended, setRecommended] = useState(initialRecommended)
  const [count, setCount] = useState(initialCount)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onClick() {
    const next = !recommended
    setRecommended(next)
    setCount((c) => c + (next ? 1 : -1))
    setError(null)
    startTransition(async () => {
      const res = next ? await recommendMethod(mixId) : await unrecommendMethod(mixId)
      if ('error' in res) {
        setRecommended(!next)
        setCount((c) => c + (next ? -1 : 1))
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={recommended}
        className="inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-sm transition-colors"
        style={{
          borderColor: recommended ? 'var(--color-ember)' : 'var(--line-strong)',
          color: recommended ? 'var(--color-ember-hot)' : 'var(--color-ash)',
          background: recommended ? 'var(--accent-tint)' : 'transparent',
          fontWeight: 600,
        }}
      >
        {recommended ? '推薦中' : 'この作り方を推薦'}
        {count > 0 && <span>{count}</span>}
      </button>
      {error && (
        <span className="text-xs" style={{ color: 'var(--color-seal)' }}>{error}</span>
      )}
    </div>
  )
}
