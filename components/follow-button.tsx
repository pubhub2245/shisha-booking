'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFollow } from '@/actions/social'

export function FollowButton({
  targetId,
  initialFollowing,
  isAuthed,
  username,
}: {
  targetId: string
  initialFollowing: boolean
  isAuthed: boolean
  username: string
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/u/${username}`)
      return
    }
    const next = !following
    setFollowing(next)
    startTransition(async () => {
      const res = await toggleFollow(targetId)
      if ('error' in res) setFollowing(!next)
      else setFollowing(res.following)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={following ? 'btn btn-ghost text-sm' : 'btn btn-ember text-sm'}
    >
      {following ? 'フォロー中' : '＋ フォロー'}
    </button>
  )
}
