'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addComment, type CommentState } from '@/actions/social'

export function CommentForm({
  mixId,
  isAuthed,
  parentId,
  placeholder,
  compact = false,
  onDone,
}: {
  mixId: string
  isAuthed: boolean
  parentId?: string
  placeholder?: string
  compact?: boolean
  onDone?: () => void
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState<CommentState, FormData>(addComment, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'ok' in state) {
      formRef.current?.reset()
      router.refresh()
      onDone?.()
    }
  }, [state, router, onDone])

  if (!isAuthed) {
    return (
      <div className="card p-4 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        コメントするには{' '}
        <Link href={`/login?next=/method/${mixId}`} style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          ログイン
        </Link>
        してください。
      </div>
    )
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="mix_id" value={mixId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      {state && 'error' in state && (
        <p className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>
          {state.error}
        </p>
      )}
      <div className="field">
        <textarea
          name="body"
          placeholder={placeholder ?? 'この作り方の感想・コツ・アレンジを書く…（@ユーザー名で言及できます）'}
          maxLength={500}
          required
          style={compact ? { minHeight: 64 } : undefined}
        />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember self-end text-sm">
        {pending ? '送信中…' : compact ? '返信する' : 'コメントする'}
      </button>
    </form>
  )
}
