'use client'

import { useActionState } from 'react'
import { submitProApplication, type ProAppState } from '@/actions/pro'
import type { ProApplication } from '@/lib/types/database'

export function ProApplicationForm({
  isPro,
  application,
}: {
  isPro: boolean
  application: ProApplication | null
}) {
  const [state, action, pending] = useActionState<ProAppState, FormData>(submitProApplication, null)

  if (isPro) {
    return (
      <div className="card p-5 text-sm" style={{ color: 'var(--color-ash)' }}>
        ✅ あなたは<b style={{ color: 'var(--color-ember-hot)' }}>認証済みプロ</b>です。名前の横に認証マークが表示されます。
      </div>
    )
  }

  const submitted = (state && 'ok' in state) || application?.status === 'pending'
  if (submitted && application?.status !== 'rejected') {
    return (
      <div className="card p-5 text-sm" style={{ color: 'var(--color-ash)' }}>
        🕓 プロ認証を<b>審査中</b>です。運営がSNSアカウントと在籍を確認のうえ、承認をお知らせします。
      </div>
    )
  }

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <div>
        <div className="text-sm" style={{ fontWeight: 700 }}>プロ認証を申請する</div>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
          シーシャ店スタッフの方向け。SNSアカウントと在籍店を運営が確認し、承認されると名前の横に認証マークが付きます。
        </p>
      </div>

      {state && 'error' in state && (
        <p className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>{state.error}</p>
      )}
      {application?.status === 'rejected' && (
        <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          前回の申請は承認されませんでした。内容を見直して再申請できます。
        </p>
      )}

      <div className="field">
        <label>SNSの種類</label>
        <select name="sns_type" defaultValue="x">
          <option value="x">X（旧Twitter）</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>
      <div className="field">
        <label>SNSアカウント（@ または プロフィールURL）</label>
        <input name="sns_handle" placeholder="@your_account または https://x.com/..." required />
      </div>
      <div className="field">
        <label>在籍しているシーシャ店名</label>
        <input name="shop_name" placeholder="SHISHA LOUNGE ○○" required />
      </div>
      <div className="field">
        <label>補足（任意）</label>
        <textarea name="message" placeholder="役職・在籍歴・確認の参考になる情報など" maxLength={300} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-ember self-start text-sm">
        {pending ? '送信中…' : '認証を申請する'}
      </button>
    </form>
  )
}
