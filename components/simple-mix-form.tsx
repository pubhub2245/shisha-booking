'use client'

import { useActionState, useState } from 'react'
import { createMix, type MixFormState } from '@/actions/mixes'
import { ALL_TASTE_TAGS } from '@/lib/tags'
import { comboKey } from '@/lib/combo'
import type { Flavor } from '@/lib/types/database'

/**
 * かんたん投稿（初心者モード）。
 * 熱管理・器具・蒸らしなどは一切出さず、タイトル／フレーバー／味わい／メモだけ。
 * 送信先は通常の createMix（フィールド名を揃えてあるので同じ動作）。
 */
export function SimpleMixForm({
  flavors,
  initialFlavorIds = [],
  comboCounts = {},
}: {
  flavors: Flavor[]
  initialFlavorIds?: string[]
  /** combo_key → 既存の作り方の件数（同じ組み合わせに別解があることを伝える） */
  comboCounts?: Record<string, number>
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

  // 選択済みフレーバー（送信されるのはこれだけ）
  const chosen = rows.map((r) => ({ row: r, f: byId.get(r.flavorId) })).filter((x) => !!x.f)

  // 配合の % 表示。合計を100として正規化するので、比率入力でもグラム入力でも同じ結果になる。
  const amounts = chosen.map((c) => Number(c.row.amount) || 0)
  const total = amounts.reduce((a, b) => a + b, 0)
  const percents =
    total > 0
      ? chosen.map((c, i) => ({ name: c.f!.name, pct: Math.round((amounts[i] / total) * 100) }))
      : []

  // 同じ組み合わせの既存の作り方の件数
  const existingCount =
    chosen.length > 0
      ? comboCounts[comboKey(chosen.map((c) => ({ brand: c.f!.brand, name: c.f!.name })))] ?? 0
      : 0

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
                  placeholder="配合"
                  aria-label="配合（比率またはグラム）"
                  className="w-20 rounded-lg border px-2 py-2 text-base sm:text-sm"
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

        {/* 配合プレビュー：入力値の比を % に正規化して見せる（6:4 でも 3g:7g でも同じ結果） */}
        {percents.length > 0 && (
          <p className="mt-2 text-sm" style={{ color: 'var(--color-cream)', fontWeight: 600 }}>
            {percents.map((p) => `${p.name} ${p.pct}%`).join(' ・ ')}
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          配合は「6 : 4」のような比率でも、実際のグラム数でもOK。どちらでも上に割合が出ます。
          <br />空欄のままでも投稿できますが、<b>どう混ぜたか</b>があると他の人が再現できます。
        </p>

        {/* 同じ組み合わせに既に別の作り方があることを伝える（禁止はしない） */}
        {existingCount > 0 && (
          <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--accent-tint)', color: 'var(--color-ash)' }}>
            この組み合わせには既に <b style={{ color: 'var(--color-cream)' }}>{existingCount}通り</b> の作り方があります。
            あなたの作り方も加えましょう。
          </p>
        )}
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
