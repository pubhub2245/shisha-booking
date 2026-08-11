'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/actions/profile'
import { AvatarInput } from '@/components/avatar-input'
import type { Profile } from '@/lib/types/database'

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null)

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      {state?.ok && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
        >
          保存しました。
        </div>
      )}
      {state?.error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}
        >
          {state.error}
        </div>
      )}

      <div className="field">
        <label>プロフィール画像</label>
        <AvatarInput
          defaultValue={profile?.avatar_url ?? ''}
          fallbackName={profile?.display_name || profile?.username || '?'}
          seed={profile?.id}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="field">
          <label>表示名</label>
          <input name="display_name" defaultValue={profile?.display_name ?? ''} placeholder="名前・ニックネーム" />
        </div>
        <div className="field">
          <label>ユーザー名</label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm" style={{ color: 'var(--color-ash-dim)', fontWeight: 700 }}>@</span>
            <input
              name="username"
              defaultValue={profile?.username ?? ''}
              placeholder="username"
              className="flex-1"
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            先頭の「@」は不要です（自動で付きます）。
          </p>
        </div>
      </div>

      <div className="field">
        <label>自己紹介</label>
        <textarea name="bio" defaultValue={profile?.bio ?? ''} placeholder="好きなフレーバー、作るときのこだわりなど" maxLength={300} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '保存中…' : 'プロフィールを保存'}
      </button>
    </form>
  )
}
