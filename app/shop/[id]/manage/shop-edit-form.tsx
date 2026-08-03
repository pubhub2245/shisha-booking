'use client'

import { useState, useTransition } from 'react'
import { updateShop } from '@/actions/shop'
import type { Shop } from '@/lib/types/database'

export function ShopEditForm({ shop }: { shop: Shop }) {
  const [msg, setMsg] = useState<null | 'ok' | string>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setMsg(null)
    startTransition(async () => {
      const res = await updateShop(shop.id, fd)
      setMsg('error' in res ? res.error ?? '更新に失敗しました。' : 'ok')
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {msg === 'ok' && (
        <div className="rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}>
          保存しました。
        </div>
      )}
      {msg && msg !== 'ok' && (
        <div className="rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--color-ember-deep)', color: 'var(--color-ember-hot)' }}>
          {msg}
        </div>
      )}
      <div className="field">
        <label>店舗名 *</label>
        <input name="name" defaultValue={shop.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label>エリア</label>
          <input name="area" defaultValue={shop.area ?? ''} placeholder="東京・渋谷" />
        </div>
        <div className="field">
          <label>Web / SNS リンク</label>
          <input name="url" defaultValue={shop.url ?? ''} placeholder="https://..." />
        </div>
      </div>
      <div className="field">
        <label>お店の紹介</label>
        <textarea name="description" defaultValue={shop.description ?? ''} maxLength={400} />
      </div>
      <button type="submit" disabled={pending} className="btn btn-ghost self-start text-sm">
        {pending ? '保存中…' : '店舗情報を保存'}
      </button>
    </form>
  )
}
