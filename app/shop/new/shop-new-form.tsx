'use client'

import { useActionState } from 'react'
import { createShop, type ShopFormState } from '@/actions/shop'

export function ShopNewForm() {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(createShop, null)

  return (
    <form action={action} className="card mt-6 flex flex-col gap-5 p-6">
      {state?.error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}
        >
          {state.error}
        </div>
      )}
      <div className="field">
        <label>店舗名 *</label>
        <input name="name" placeholder="SHISHA LOUNGE ○○" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label>エリア</label>
          <input name="area" placeholder="東京・渋谷" />
        </div>
        <div className="field">
          <label>Web / SNS リンク</label>
          <input name="url" placeholder="https://..." />
        </div>
      </div>
      <div className="field">
        <label>お店の紹介（任意）</label>
        <textarea name="description" placeholder="お店の雰囲気、こだわり、営業時間など" maxLength={400} />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '登録中…' : 'お店を登録する'}
      </button>
      <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        登録するとあなたが<b>オーナー</b>になります。他のスタッフは、お店のページから参加申請 → あなたが承認して所属できます。
      </p>
    </form>
  )
}
