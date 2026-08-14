'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleBookmark } from '@/actions/social'

export function BookmarkButton({
  mixId,
  initialSaved,
  isAuthed,
}: {
  mixId: string
  initialSaved: boolean
  isAuthed: boolean
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/mix/${mixId}`)
      return
    }
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const res = await toggleBookmark(mixId)
      if ('error' in res) setSaved(!next)
      else setSaved(res.saved)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? '保存済み' : '保存する'}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
      style={{
        borderColor: saved ? 'var(--color-ember)' : 'var(--line-strong)',
        color: saved ? 'var(--color-ember-hot)' : 'var(--color-ash)',
        background: saved ? 'var(--accent-tint)' : 'transparent',
        fontWeight: 600,
      }}
    >
      <span aria-hidden>{saved ? '🔖' : '＋'}</span>
      {saved ? '保存済み' : '保存'}
    </button>
  )
}
