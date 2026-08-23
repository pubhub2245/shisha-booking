'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleCommentLike } from '@/actions/social'

export function CommentLikeButton({
  commentId,
  initialCount,
  initialLiked,
  isAuthed,
}: {
  commentId: string
  initialCount: number
  initialLiked: boolean
  isAuthed: boolean
}) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push('/login')
      return
    }
    const next = !liked
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const res = await toggleCommentLike(commentId)
      if ('error' in res) {
        setLiked(!next)
        setCount((c) => c + (next ? -1 : 1))
      } else {
        setLiked(res.liked)
        setCount(res.count)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label="コメントにいいね"
      className="inline-flex items-center gap-1 text-xs transition-colors"
      style={{ color: liked ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)', fontWeight: 600 }}
    >
      <span aria-hidden>{liked ? '' : ''}</span>
      {count > 0 && count}
    </button>
  )
}
