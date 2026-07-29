'use client'

import { useActionState, useState } from 'react'
import { updateProfile, type ProfileState } from '@/actions/profile'
import type { Profile } from '@/lib/types/database'

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null)
  const [isShop, setIsShop] = useState(profile?.is_shop ?? false)

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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="field">
          <label>表示名</label>
          <input name="display_name" defaultValue={profile?.display_name ?? ''} placeholder="名前・ニックネーム" />
        </div>
        <div className="field">
          <label>ユーザー名（@）</label>
          <input name="username" defaultValue={profile?.username ?? ''} placeholder="username" />
        </div>
      </div>

      <div className="field">
        <label>自己紹介</label>
        <textarea name="bio" defaultValue={profile?.bio ?? ''} placeholder="好きなフレーバー、作るときのこだわりなど" maxLength={300} />
      </div>

      <div className="divider" />

      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" name="is_shop" checked={isShop} onChange={(e) => setIsShop(e.target.checked)} />
        <span style={{ fontWeight: 600 }}>店舗として登録する</span>
        <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          お店のミックスで集客につなげましょう
        </span>
      </label>

      {isShop && (
        <div className="card flex flex-col gap-4 p-5">
          <div className="field">
            <label>店舗名</label>
            <input name="shop_name" defaultValue={profile?.shop_name ?? ''} placeholder="SHISHA LOUNGE ○○" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label>エリア</label>
              <input name="shop_area" defaultValue={profile?.shop_area ?? ''} placeholder="東京・渋谷" />
            </div>
            <div className="field">
              <label>Web / SNS リンク</label>
              <input name="shop_url" defaultValue={profile?.shop_url ?? ''} placeholder="https://..." />
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '保存中…' : 'プロフィールを保存'}
      </button>
    </form>
  )
}
