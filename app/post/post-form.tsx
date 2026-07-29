'use client'

import { useActionState, useState } from 'react'
import { createMix, type MixFormState } from '@/actions/mixes'

type Row = { id: number }

export function PostForm() {
  const [state, action, pending] = useActionState<MixFormState, FormData>(createMix, null)
  const [rows, setRows] = useState<Row[]>([{ id: 1 }, { id: 2 }])
  const [nextId, setNextId] = useState(3)

  function addRow() {
    setRows((r) => [...r, { id: nextId }])
    setNextId((n) => n + 1)
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r))
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      {state?.error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.10)', color: 'var(--color-ember-hot)' }}
        >
          {state.error}
        </div>
      )}

      <div className="field">
        <label>タイトル *</label>
        <input name="title" required placeholder="例：王道スッキリ｜ダブルアップル × ミント" maxLength={80} />
      </div>

      {/* ---------- FLAVORS ---------- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>
            使用フレーバー *
          </label>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>購入リンクを貼るとアフィリエイトになります</span>
        </div>
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={row.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                  フレーバー {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-xs"
                  style={{ color: 'var(--color-ash-dim)' }}
                >
                  削除
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
                <div className="field">
                  <input name="flavor_name" placeholder="フレーバー名（例：ダブルアップル）" />
                </div>
                <div className="field">
                  <input name="flavor_brand" placeholder="ブランド（例：AL FAKHER）" />
                </div>
                <div className="field">
                  <input name="flavor_ratio" inputMode="numeric" placeholder="割合%" />
                </div>
              </div>
              <div className="field mt-3">
                <input name="flavor_url" placeholder="購入リンク（任意 / アフィリエイトURL）" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="btn btn-ghost mt-3 text-sm">
          ＋ フレーバーを追加
        </button>
      </div>

      <div className="field">
        <label>味わいタグ（カンマ区切り）</label>
        <input name="taste_tags" placeholder="甘い, スッキリ, フルーツ" />
      </div>

      <div className="field">
        <label>濃さ</label>
        <select name="strength" defaultValue="medium">
          <option value="light">軽め</option>
          <option value="medium">ふつう</option>
          <option value="strong">濃いめ</option>
        </select>
      </div>

      <div className="field">
        <label>説明・どんな味か</label>
        <textarea name="description" placeholder="どんな気分のときに、どう美味しいか。おすすめの飲み物など。" maxLength={600} />
      </div>

      <div className="divider" />
      <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
        作り方ノート（任意）— シーシャは作り方で味が変わります。ノウハウを共有しましょう。
      </p>

      <div className="field">
        <label>🔥 熱帯・炭の管理（時間経過のイメージ）</label>
        <textarea name="heat_management" placeholder="例：序盤は炭3つで軽め、中盤に1つ足して立ち上げる。" maxLength={600} />
      </div>

      <div className="field">
        <label>🍃 フレーバーの置き方</label>
        <textarea name="placement_note" placeholder="例：ダブルアップルを底に厚め、ミントは表面に薄く散らす。" maxLength={600} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '投稿中…' : 'ミックスを投稿する'}
      </button>
    </form>
  )
}
