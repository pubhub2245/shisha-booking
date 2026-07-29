'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, signUp, type AuthState } from '@/actions/auth'

export function AuthForm({ mode, next }: { mode: 'login' | 'signup'; next?: string }) {
  const fn = mode === 'login' ? signIn : signUp
  const [state, action, pending] = useActionState<AuthState, FormData>(fn, null)

  const error = state && 'error' in state ? state.error : null
  const notice = state && 'notice' in state ? state.notice : null

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember)', background: 'rgb(255 122 69 / 0.08)', color: 'var(--color-coal)' }}
        >
          ✉️ {notice}
        </div>
      )}

      <div className="field">
        <label>メールアドレス</label>
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>パスワード</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'signup' ? '6文字以上' : '••••••••'}
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-ember">
        {pending ? '処理中…' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--color-ash)' }}>
        {mode === 'login' ? (
          <>
            アカウントがない方は{' '}
            <Link href="/signup" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでに登録済みの方は{' '}
            <Link href="/login" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              ログイン
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
