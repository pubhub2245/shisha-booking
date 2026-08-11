'use client'

import { useState, useTransition } from 'react'
import { importFlavorsFromShop, type FlavorState } from '@/actions/flavors'

const PRESETS = [
  { label: 'シーシャ卸.com', url: 'https://shisha-oroshi.myshopify.com' },
]

/** 管理者用：ショップURLからフレーバーを一括取り込み（ボタン一発）。 */
export function FlavorImport() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<FlavorState>(null)
  const [pending, start] = useTransition()

  function run(target: string) {
    if (!target.trim() || pending) return
    setState(null)
    start(async () => {
      const res = await importFlavorsFromShop(target)
      setState(res)
    })
  }

  return (
    <section className="card p-5">
      <h2 className="text-base" style={{ fontWeight: 700 }}>🌐 通販から自動取り込み（管理者）</h2>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
        Shopify製のシーシャ通販URLを入れて押すだけ。サーバーが全ブランドの商品名を取得して図鑑に追加します（既存は自動スキップ）。
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.url}
            type="button"
            onClick={() => run(p.url)}
            disabled={pending}
            className="chip chip-active"
          >
            {p.label} を取り込む
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxx.myshopify.com（他の通販URL）"
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
        <button type="button" onClick={() => run(url)} disabled={pending} className="btn btn-ember text-sm">
          {pending ? '取り込み中…' : '取り込む'}
        </button>
      </div>

      {pending && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          取得中です（ブランド数により10〜30秒ほどかかることがあります）…
        </p>
      )}
      {state && 'error' in state && state.error && (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ember-hot)' }}>{state.error}</p>
      )}
      {state && 'ok' in state && state.ok && (
        <p className="mt-2 text-sm" style={{ color: '#2ba088', fontWeight: 600 }}>✅ {state.ok}</p>
      )}

      <p className="mt-3 text-[0.68rem] leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
        ※ 取り込み後は <a href="/flavors" className="underline">フレーバー図鑑</a> で内容をご確認ください。おかしい名前があれば個別に修正できます。
      </p>
    </section>
  )
}
