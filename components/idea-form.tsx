'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createIdea, type IdeaState } from '@/actions/ideas'

export function IdeaForm({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<IdeaState, FormData>(createIdea, null)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'ok' in state) {
      ref.current?.reset()
      router.refresh()
    }
  }, [state, router])

  if (!isAuthed) {
    return (
      <div className="card p-5 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        意見を投稿するには{' '}
        <Link href="/login?next=/ideas" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>ログイン</Link>
        してください。投票（👍👎）も同様です。
      </div>
    )
  }

  return (
    <form ref={ref} action={action} className="card flex flex-col gap-3 p-5">
      {state && 'error' in state && (
        <p className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>{state.error}</p>
      )}
      <div className="field">
        <label>改修したい点・要望</label>
        <input name="title" placeholder="例：投稿画面の熱グラフをもっと簡単に" maxLength={120} required />
      </div>
      <div className="field">
        <label>詳細（任意）</label>
        <textarea name="body" placeholder="どんな場面で困るか／こうなると嬉しい など" maxLength={1000} />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember self-end text-sm">
        {pending ? '送信中…' : '意見を投稿'}
      </button>
    </form>
  )
}
