'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, signUp, type AuthState } from '@/actions/auth'
import { EMAIL_ENABLED } from '@/lib/site'

export function AuthForm({ mode, next }: { mode: 'login' | 'signup'; next?: string }) {
  const fn = mode === 'login' ? signIn : signUp
  const [state, action, pending] = useActionState<AuthState, FormData>(fn, null)

  const error = state && 'error' in state ? state.error : null
  // 失敗しても打ち直しにならないよう、送ったアドレスを戻す
  const lastEmail = state && 'error' in state ? state.email ?? '' : ''
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
          style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
        >
          {notice}
        </div>
      )}

      <div className="field">
        <label>メールアドレス</label>
        <input
          key={lastEmail}
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={lastEmail}
          placeholder="you@example.com"
        />
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

      {mode === 'signup' && !EMAIL_ENABLED && (
        <p
          className="rounded-lg px-3 py-2 text-xs leading-relaxed"
          style={{ background: 'rgb(213 153 43 / 0.12)', color: '#b7791f' }}
        >
          現在はメール認証を使わない運用のため、<b>パスワードを忘れると再設定できません</b>。
          メールアドレスとパスワードは必ず控えておいてください。
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-ember">
        {pending ? '処理中…' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
      </button>

      {mode === 'login' && EMAIL_ENABLED && (
        <p className="-mt-1 text-center text-sm">
          <Link href="/forgot" style={{ color: 'var(--color-ash-dim)' }}>
            パスワードをお忘れですか？
          </Link>
        </p>
      )}

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
