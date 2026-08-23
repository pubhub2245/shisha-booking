'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addIdeaComment, deleteIdeaComment, arbitrateIdea } from '@/actions/idea-comments'
import type { IdeaCommentWithAuthor, IdeaArbitration } from '@/lib/types/database'
import { Avatar } from '@/components/avatar'
import { relativeTime } from '@/lib/time'

export function IdeaComments({
  ideaId,
  comments,
  arbitration,
  up,
  down,
  isAuthed,
  isAdmin,
  currentUserId,
}: {
  ideaId: number
  comments: IdeaCommentWithAuthor[]
  arbitration: IdeaArbitration | null
  up: number
  down: number
  isAuthed: boolean
  isAdmin: boolean
  currentUserId: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [pending, startTransition] = useTransition()
  const [arbErr, setArbErr] = useState('')
  const [arbPending, startArb] = useTransition()

  // 賛否が割れている＝仲裁の出番
  const split = up >= 1 && down >= 1

  function submit() {
    const body = text.trim()
    if (!body) {
      setErr('コメントを入力してください。')
      return
    }
    setErr('')
    startTransition(async () => {
      const res = await addIdeaComment(ideaId, body)
      if ('error' in res) {
        setErr(res.error)
      } else {
        setText('')
        router.refresh()
      }
    })
  }

  function runArbitration() {
    setArbErr('')
    startArb(async () => {
      const res = await arbitrateIdea(ideaId)
      if ('error' in res) {
        setArbErr(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const count = comments.length

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs"
        style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}
      >
        コメント{count > 0 ? `（${count}）` : ''} {open ? '▲' : '▼'}
      </button>

      {/* AI 仲裁案（あれば常に表示） */}
      {arbitration && (
        <div
          className="mt-2 rounded-xl border p-3"
          style={{ borderColor: 'rgb(31 138 118 / 0.35)', background: 'rgb(31 138 118 / 0.08)' }}
        >
          <p className="text-xs" style={{ color: '#2ba088', fontWeight: 800 }}>AIの仲裁案（落とし所）</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-cream)' }}>
            {arbitration.summary}
          </p>
          <p className="mt-1.5 text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>
            AI生成・参考案 ・ {relativeTime(arbitration.updated_at)}
          </p>
        </div>
      )}

      {open && (
        <div className="mt-2 flex flex-col gap-3">
          {comments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => {
                const canDelete = isAdmin || (currentUserId && c.user_id === currentUserId)
                return (
                  <li key={c.id} className="rounded-lg border p-2" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                      <Avatar name={c.author?.display_name || c.author?.username || '?'} seed={c.user_id || String(c.id)} size={16} />
                      {c.author?.username ? (
                        <Link href={`/u/${c.author.username}`} className="hover:underline">
                          {c.author.display_name || `@${c.author.username}`}
                        </Link>
                      ) : (
                        <span>{c.author?.display_name || '匿名'}</span>
                      )}
                      <span>・ {relativeTime(c.created_at)}</span>
                      {canDelete && (
                        <form action={deleteIdeaComment} className="ml-auto">
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
                        </form>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>{c.body}</p>
                  </li>
                )
              })}
            </ul>
          )}

          {/* 仲裁ボタン（賛否が割れているとき） */}
          {split && (
            <div className="rounded-lg border border-dashed p-2" style={{ borderColor: 'var(--line-strong)' }}>
              <p className="text-xs" style={{ color: 'var(--color-ash)' }}>
                賛成 {up} / 反対 {down} で意見が割れています。AIに中立の落とし所を提案してもらえます。
              </p>
              <button
                type="button"
                onClick={runArbitration}
                disabled={arbPending}
                className="mt-2 rounded-lg px-3 py-1.5 text-xs"
                style={{ background: 'rgb(31 138 118 / 0.15)', color: '#2ba088', fontWeight: 700 }}
              >
                {arbPending ? '仲裁中…' : arbitration ? 'もう一度AIに仲裁してもらう' : 'AIに仲裁してもらう'}
              </button>
              {arbErr && <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{arbErr}</p>}
            </div>
          )}

          {/* コメント投稿 */}
          {isAuthed ? (
            <div>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (err) setErr('')
                }}
                rows={2}
                maxLength={1000}
                placeholder="反対意見に返信する・議論する…"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
              />
              {err && <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{err}</p>}
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="rounded-lg px-3 py-1.5 text-xs"
                  style={{ background: 'var(--color-ember-hot)', color: '#fff', fontWeight: 700 }}
                >
                  {pending ? '送信中…' : 'コメントする'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              <Link href="/login?next=/ideas" className="hover:underline" style={{ color: 'var(--color-ember-hot)' }}>ログイン</Link>すると議論に参加できます。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
