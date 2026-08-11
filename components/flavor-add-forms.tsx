'use client'

import { useActionState } from 'react'
import { addFlavor, bulkAddFlavors, type FlavorState } from '@/actions/flavors'

function Msg({ state }: { state: FlavorState }) {
  if (!state) return null
  if ('error' in state && state.error) return <p className="mt-2 text-sm" style={{ color: 'var(--color-ember-hot)' }}>{state.error}</p>
  if ('ok' in state && state.ok) return <p className="mt-2 text-sm" style={{ color: '#2ba088', fontWeight: 600 }}>✅ {state.ok}</p>
  return null
}

export function FlavorAddForms({ isAdmin, brands }: { isAdmin: boolean; brands: string[] }) {
  const [single, singleAction, singlePending] = useActionState<FlavorState, FormData>(addFlavor, null)
  const [bulk, bulkAction, bulkPending] = useActionState<FlavorState, FormData>(bulkAddFlavors, null)

  return (
    <div className="mt-6 flex flex-col gap-8">
      {/* 1件ずつ */}
      <section className="card p-5">
        <h2 className="text-base" style={{ fontWeight: 700 }}>1件ずつ追加</h2>
        <form action={singleAction} className="mt-3 flex flex-col gap-3">
          <div className="field">
            <label>ブランド</label>
            <input name="brand" list="brand-list" required placeholder="例：AL FAKHER" maxLength={60} />
            <datalist id="brand-list">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>フレーバー名</label>
            <input name="name" required placeholder="例：ダブルアップル" maxLength={80} />
          </div>
          {isAdmin && (
            <div className="field">
              <label>購入リンク（任意・管理者のみ）</label>
              <input name="affiliate_url" placeholder="アフィリエイトURL" />
            </div>
          )}
          <button type="submit" disabled={singlePending} className="btn btn-ember self-start text-sm">
            {singlePending ? '追加中…' : '追加する'}
          </button>
          <Msg state={single} />
        </form>
      </section>

      {/* 一括貼り付け */}
      <section className="card p-5">
        <h2 className="text-base" style={{ fontWeight: 700 }}>まとめて追加（貼り付け）</h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          1行に1つ、<b>「ブランド, 名前」</b>の形式で貼り付け（カンマ／スラッシュ区切り可）。既存は自動でスキップします。最大500行。
        </p>
        <form action={bulkAction} className="mt-3 flex flex-col gap-3">
          <textarea
            name="bulk"
            rows={10}
            placeholder={'AL FAKHER, ミント\nADALYA, ラブ66\nFUMARI, ホワイトグミベア'}
            className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
            style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
          />
          <button type="submit" disabled={bulkPending} className="btn btn-ember self-start text-sm">
            {bulkPending ? '追加中…' : 'まとめて追加'}
          </button>
          <Msg state={bulk} />
        </form>
      </section>
    </div>
  )
}
