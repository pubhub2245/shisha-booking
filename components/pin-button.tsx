'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePinnedMix } from '@/actions/mixes'

/** 自分のミックスを「看板レシピ」に設定/解除するトグル（投稿者本人のみ表示）。 */
export function PinButton({ mixId, initialPinned }: { mixId: string; initialPinned: boolean }) {
  const router = useRouter()
  const [pinned, setPinned] = useState(initialPinned)
  const [pending, start] = useTransition()

  function toggle() {
    const prev = pinned
    setPinned(!prev)
    start(async () => {
      const res = await togglePinnedMix(mixId)
      if ('error' in res) {
        setPinned(prev)
      } else {
        setPinned(res.pinned)
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={pinned}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-transform hover:scale-[1.03]"
      style={
        pinned
          ? { borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }
          : { borderColor: 'var(--line-strong)', color: 'var(--color-ash)', fontWeight: 600 }
      }
      title="プロフィール上部に固定表示する自信作"
    >
      <span aria-hidden>📌</span>
      {pinned ? '看板レシピ' : '看板に設定'}
    </button>
  )
}
