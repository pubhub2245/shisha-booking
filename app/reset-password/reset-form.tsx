'use client'

import { useActionState } from 'react'
import { updatePassword, type AuthState } from '@/actions/auth'

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, null)
  const error = state && 'error' in state ? state.error : null

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}>
          {error}
        </div>
      )}
      <div className="field">
        <label>新しいパスワード</label>
        <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="6文字以上" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember">
        {pending ? '更新中…' : 'パスワードを更新'}
      </button>
    </form>
  )
}
