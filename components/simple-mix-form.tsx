'use client'

import { useActionState, useState } from 'react'
import { createMix, type MixFormState } from '@/actions/mixes'
import { ALL_TASTE_TAGS } from '@/lib/tags'
import type { Flavor } from '@/lib/types/database'

/**
 * かんたん投稿（初心者モード）。
 * 熱管理・器具・蒸らしなどは一切出さず、タイトル／フレーバー／味わい／メモだけ。
 * 送信先は通常の createMix（フィールド名を揃えてあるので同じ動作）。
 */
export function SimpleMixForm({
  flavors,
  initialFlavorIds = [],
}: {
  flavors: Flavor[]
  initialFlavorIds?: string[]
}) {
  const [state, action, pending] = useActionState<MixFormState, FormData>(createMix, null)
  const byId = new Map(flavors.map((f) => [f.id, f]))
  const [rows, setRows] = useState<{ key: number; flavorId: string; amount: string }[]>(
    initialFlavorIds.length
      ? initialFlavorIds.map((id, i) => ({ key: i + 1, flavorId: id, amount: '' }))
      : [{ key: 1, flavorId: '', amount: '' }]
  )
  const [tags, setTags] = useState<string[]>([])

  function addRow() {
    setRows((r) => [...r, { key: (r[r.length - 1]?.key ?? 0) + 1, flavorId: '', amount: '' }])
  }
  function removeRow(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r))
  }
  function setRow(key: number, patch: Partial<{ flavorId: string; amount: string }>) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  }
  function toggleTag(t: string) {
    setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-6">
      <div>
        <label className="mb-1 block text-sm" style={{ fontWeight: 700 }}>
          使うフレーバー <span style={{ color: 'var(--color-ember-hot)' }}>必須</span>
        </label>
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const f = byId.get(row.flavorId)
            return (
              <div key={row.key} className="flex items-center gap-2">
                <select
                  value={row.flavorId}
                  onChange={(e) => setRow(row.key, { flavorId: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
                >
                  <option value="">フレーバーを選ぶ</option>
                  {flavors.map((fl) => (
                    <option key={fl.id} value={fl.id}>{fl.brand} — {fl.name}</option>
                  ))}
                </select>
                <input
                  value={row.amount}
                  onChange={(e) => setRow(row.key, { amount: e.target.value })}
                  inputMode="decimal"
                  placeholder="量(g)"
                  aria-label="量（グラム・任意）"
                  className="w-16 rounded-lg border px-2 py-2 text-sm"
                  style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
                />
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(row.key)} aria-label="削除" style={{ color: 'var(--color-ash-dim)' }}>
                    ×
                  </button>
                )}
                {/* 送信用（createMix の並列配列フィールドに合わせる） */}
                {f && (
                  <>
                    <input type="hidden" name="flavor_id" value={f.id} />
                    <input type="hidden" name="flavor_brand" value={f.brand} />
                    <input type="hidden" name="flavor_name" value={f.name} />
                    <input type="hidden" name="flavor_ratio" value={row.amount} />
                    <input type="hidden" name="flavor_url" value="" />
                  </>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addRow} className="btn btn-ghost mt-3 text-sm">＋ フレーバーを追加</button>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          量はスケールがなければ空欄でOK。割合のコツはメモに書けます。
        </p>
      </div>

      <div className="field">
        <label>特徴・ひとこと（任意）</label>
        <input name="title" maxLength={40} placeholder="例：王道スッキリ（空でもOK）" />
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          名前はフレーバーで自動的に付きます。ひとことだけ添えたいときにどうぞ。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm" style={{ fontWeight: 700 }}>味わい（任意）</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TASTE_TAGS.map((t) => (
            <label key={t} className={`chip cursor-pointer ${tags.includes(t) ? 'chip-active' : ''}`}>
              <input
                type="checkbox"
                name="taste_tags"
                value={t}
                checked={tags.includes(t)}
                onChange={() => toggleTag(t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>ひとことメモ（任意）</label>
        <textarea name="description" rows={3} maxLength={500} placeholder="味の感想、割合のコツ、おすすめの吸い方など" />
      </div>

      {state?.error && <p className="text-sm" style={{ color: 'var(--color-ember-hot)' }}>{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-ember">
        {pending ? '投稿中…' : '投稿する'}
      </button>
    </form>
  )
}
