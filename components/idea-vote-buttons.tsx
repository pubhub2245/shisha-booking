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
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonErr, setReasonErr] = useState('')

  function commit(v: 1 | -1, reasonText?: string) {
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
      const res = await voteIdea(ideaId, v, reasonText)
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

  function onUp() {
    if (!isAuthed) {
      router.push('/login?next=/ideas')
      return
    }
    setReasonOpen(false)
    commit(1)
  }

  function onDown() {
    if (!isAuthed) {
      router.push('/login?next=/ideas')
      return
    }
    // すでに反対済み → 取り消し（理由不要）
    if (mine === -1) {
      commit(-1)
      return
    }
    // 新規の反対 → 理由の入力を求める
    setReason('')
    setReasonErr('')
    setReasonOpen(true)
  }

  function submitReason() {
    const trimmed = reason.trim()
    if (!trimmed) {
      setReasonErr('理由を入力してください。')
      return
    }
    setReasonOpen(false)
    commit(-1, trimmed)
  }

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onUp}
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
        onClick={onDown}
        disabled={pending}
        aria-label="反対"
        aria-pressed={mine === -1}
        className="text-xl leading-none transition-transform hover:scale-110"
        style={{ color: mine === -1 ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)' }}
      >
        ▼
      </button>
      <span className="text-[0.6rem]" style={{ color: 'var(--color-ash-dim)' }}>👍{u} 👎{d}</span>

      {reasonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.5)' }}
          onClick={() => setReasonOpen(false)}
        >
          <div
            className="card w-full max-w-sm p-4 text-left"
            style={{ background: 'var(--color-smoke-900, var(--surface))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm" style={{ fontWeight: 700 }}>反対の理由を教えてください</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              なぜ改修しない方が良いと思うか、ひとことでOKです。他の人の判断材料になります。
            </p>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (reasonErr) setReasonErr('')
              }}
              rows={3}
              maxLength={300}
              autoFocus
              placeholder="例：既存の機能で代替できる／使う人が少なそう など"
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
            />
            {reasonErr && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{reasonErr}</p>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReasonOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{ color: 'var(--color-ash)' }}
              >
                やめる
              </button>
              <button
                type="button"
                onClick={submitReason}
                disabled={pending}
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{ background: 'var(--color-ember-hot)', color: '#fff', fontWeight: 700 }}
              >
                反対する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
