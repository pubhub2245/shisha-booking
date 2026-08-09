'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { voteIdea } from '@/actions/ideas'

export function IdeaVoteButtons({
  ideaId,
  up,
  down,
  myVote,
  isAuthed,
}: {
  ideaId: number
  up: number
  down: number
  myVote: number
  isAuthed: boolean
}) {
  const router = useRouter()
  const [u, setU] = useState(up)
  const [d, setD] = useState(down)
  const [mine, setMine] = useState(myVote)
  const [pending, startTransition] = useTransition()

  function vote(v: 1 | -1) {
    if (!isAuthed) {
      router.push('/login?next=/ideas')
      return
    }
    const prevU = u
    const prevD = d
    const prevMine = mine
    let nu = u
    let nd = d
    if (prevMine === 1) nu--
    if (prevMine === -1) nd--
    let nm: number
    if (prevMine === v) {
      nm = 0
    } else {
      nm = v
      if (v === 1) nu++
      else nd++
    }
    setU(nu)
    setD(nd)
    setMine(nm)
    startTransition(async () => {
      const res = await voteIdea(ideaId, v)
      if ('error' in res) {
        setU(prevU)
        setD(prevD)
        setMine(prevMine)
      } else {
        setU(res.up)
        setD(res.down)
        setMine(res.myVote)
      }
    })
  }

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={pending}
        aria-label="賛成（改修希望）"
        aria-pressed={mine === 1}
        className="text-xl leading-none transition-transform hover:scale-110"
        style={{ color: mine === 1 ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)' }}
      >
        ▲
      </button>
      <span className="text-sm" style={{ fontWeight: 800, color: u - d > 0 ? 'var(--color-ember-hot)' : 'var(--color-ash)' }}>
        {u - d}
      </span>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={pending}
        aria-label="反対"
        aria-pressed={mine === -1}
        className="text-xl leading-none transition-transform hover:scale-110"
        style={{ color: mine === -1 ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)' }}
      >
        ▼
      </button>
      <span className="text-[0.6rem]" style={{ color: 'var(--color-ash-dim)' }}>👍{u} 👎{d}</span>
    </div>
  )
}
