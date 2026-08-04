'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset, type AuthState } from '@/actions/auth'

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, null)
  const error = state && 'error' in state ? state.error : null
  const notice = state && 'notice' in state ? state.notice : null

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}>
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}>
          ✉️ {notice}
        </div>
      )}
      <div className="field">
        <label>メールアドレス</label>
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember">
        {pending ? '送信中…' : '再設定メールを送る'}
      </button>
      <p className="text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        <Link href="/login" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>ログインに戻る</Link>
      </p>
    </form>
  )
}
