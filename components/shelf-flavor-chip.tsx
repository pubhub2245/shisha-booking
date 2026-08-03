'use client'

import { useState, useTransition } from 'react'
import { toggleShelf } from '@/actions/shelf'

export function ShelfFlavorChip({
  flavorId,
  label,
  initialOwned,
}: {
  flavorId: string
  label: string
  initialOwned: boolean
}) {
  const [owned, setOwned] = useState(initialOwned)
  const [pending, startTransition] = useTransition()

  function onClick() {
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
      className={`chip ${owned ? 'chip-active' : ''}`}
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      <span aria-hidden className="mr-1">{owned ? '✓' : '＋'}</span>
      {label}
    </button>
  )
}
