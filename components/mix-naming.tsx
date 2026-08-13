'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { proposeMixName, voteMixName, deleteMixName } from '@/actions/mix-names'
import type { MixNameWithVotes } from '@/lib/types/database'

function VoteButton({ name, isAuthed }: { name: MixNameWithVotes; isAuthed: boolean }) {
  const router = useRouter()
  const [votes, setVotes] = useState(name.votes)
  const [mine, setMine] = useState(name.myVote)
  const [pending, start] = useTransition()

  function toggle() {
    if (!isAuthed) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname))
      return
    }
    const pv = votes
    const pm = mine
    setVotes(mine ? votes - 1 : votes + 1)
    setMine(!mine)
    start(async () => {
      const res = await voteMixName(name.id)
      if ('error' in res) {
        setVotes(pv)
        setMine(pm)
      } else {
        setVotes(res.votes)
        setMine(res.myVote)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={mine}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-transform hover:scale-105"
      style={
        mine
          ? { borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }
          : { borderColor: 'var(--line-strong)', color: 'var(--color-ash)' }
      }
    >
      👍 {votes}
    </button>
  )
}

export function MixNaming({
  mixId,
  names,
  isAuthed,
  currentUserId,
  isAdmin,
}: {
  mixId: string
  names: MixNameWithVotes[]
  isAuthed: boolean
  currentUserId: string | null
  isAdmin: boolean
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()

  const winner = names.length > 0 && names[0].votes > 0 ? names[0] : null

  function submit() {
    const name = text.trim()
    if (!name) {
      setErr('名前を入力してください。')
      return
    }
    setErr('')
    start(async () => {
      const res = await proposeMixName(mixId, name)
      if (res && 'error' in res) {
        setErr(res.error)
      } else {
        setText('')
        router.refresh()
      }
    })
  }

  return (
    <section className="mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-sm eyebrow">📛 公募ネーミング</h2>
      <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        王道に選ばれた一台の<b>愛称</b>を、みんなで決めましょう。案を出して👍が一番集まった名前が愛称になります。
      </p>

      {winner && (
        <div className="mb-3 rounded-xl border p-4 text-center" style={{ borderColor: 'rgb(178 59 46 / 0.35)', background: 'rgb(178 59 46 / 0.06)' }}>
          <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>現在の愛称（最多得票）</div>
          <div className="mt-0.5 text-xl" style={{ fontWeight: 800 }}>「{winner.name}」</div>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>👍 {winner.votes}</div>
        </div>
      )}

      {names.length > 0 && (
        <ul className="flex flex-col gap-2">
          {names.map((n) => (
            <li key={n.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
              <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: 700 }}>{n.name}</span>
              {(isAdmin || (currentUserId && n.user_id === currentUserId)) && (
                <form action={deleteMixName}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="mix_id" value={mixId} />
                  <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
                </form>
              )}
              <VoteButton name={n} isAuthed={isAuthed} />
            </li>
          ))}
        </ul>
      )}

      {isAuthed ? (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (err) setErr('')
            }}
            maxLength={30}
            placeholder="愛称の案を入力（例：王道スッキリ）"
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
          />
          <button type="button" onClick={submit} disabled={pending} className="btn btn-ember shrink-0 text-sm">
            {pending ? '送信中…' : '提案'}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>ログインすると名前を提案・投票できます。</p>
      )}
      {err && <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{err}</p>}
    </section>
  )
}
