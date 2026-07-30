'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addComment, type CommentState } from '@/actions/social'

export function CommentForm({ mixId, isAuthed }: { mixId: string; isAuthed: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<CommentState, FormData>(addComment, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'ok' in state) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state, router])

  if (!isAuthed) {
    return (
      <div className="card p-4 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        コメントするには{' '}
        <Link href={`/login?next=/mix/${mixId}`} style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          ログイン
        </Link>
        してください。
      </div>
    )
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="mix_id" value={mixId} />
      {state && 'error' in state && (
        <p className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>
          {state.error}
        </p>
      )}
      <div className="field">
        <textarea name="body" placeholder="このミックスの感想・コツ・アレンジを書く…" maxLength={500} required />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember self-end text-sm">
        {pending ? '送信中…' : 'コメントする'}
      </button>
    </form>
  )
}
