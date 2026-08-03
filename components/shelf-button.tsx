'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleShelf } from '@/actions/shelf'

export function ShelfButton({
  flavorId,
  initialOwned,
  isAuthed,
  nextPath,
}: {
  flavorId: string
  initialOwned: boolean
  isAuthed: boolean
  nextPath?: string
}) {
  const router = useRouter()
  const [owned, setOwned] = useState(initialOwned)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(nextPath || `/flavor/${flavorId}`)}`)
      return
    }
    const next = !owned
    setOwned(next)
    startTransition(async () => {
      const res = await toggleShelf(flavorId)
      if ('error' in res) setOwned(!next)
      else setOwned(res.owned)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={owned}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
      style={{
        borderColor: owned ? 'var(--color-ember)' : 'var(--line-strong)',
        color: owned ? 'var(--color-ember-hot)' : 'var(--color-ash)',
        background: owned ? 'var(--accent-tint)' : 'transparent',
        fontWeight: 600,
      }}
    >
      <span aria-hidden>{owned ? '🫙' : '＋'}</span>
      {owned ? 'マイ棚にあり' : 'マイ棚に追加'}
    </button>
  )
}
