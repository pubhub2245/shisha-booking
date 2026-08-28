'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleLike } from '@/actions/mixes'

export function LikeButton({
  mixId,
  initialCount,
  initialLiked,
  isAuthed,
  size = 'sm',
  showCount = true,
}: {
  mixId: string
  initialCount: number
  initialLiked: boolean
  isAuthed: boolean
  size?: 'sm' | 'lg'
  /** 他人の総数を出すか。作り方の詳細では出さない（序列を持ち込まないため） */
  showCount?: boolean
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [pop, setPop] = useState(false)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push('/login?next=/')
      return
    }
    // optimistic
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))
    setPop(true)
    setTimeout(() => setPop(false), 300)

    startTransition(async () => {
      const res = await toggleLike(mixId)
      if ('error' in res) {
        // rollback
        setLiked(!nextLiked)
        setCount((c) => c + (nextLiked ? -1 : 1))
      } else {
        setLiked(res.liked)
        setCount(res.count)
      }
    })
  }

  const big = size === 'lg'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label="いいね"
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors"
      style={{
        borderColor: liked ? 'var(--color-ember)' : 'var(--line-strong)',
        color: liked ? 'var(--color-ember-hot)' : 'var(--color-ash)',
        background: liked ? 'var(--accent-tint)' : 'transparent',
        fontSize: big ? '0.95rem' : '0.82rem',
      }}
    >
      <span className={pop ? 'like-pop' : ''} aria-hidden style={{ lineHeight: 1 }}>
        {liked ? '' : ''}
      </span>
      {showCount && <span style={{ fontWeight: 600 }}>{count}</span>}
    </button>
  )
}
