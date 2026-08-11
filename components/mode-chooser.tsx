'use client'

import { useTransition, useState } from 'react'
import { setUiMode } from '@/actions/profile'

/** 初回にモードを選ばせるカード（ui_mode 未設定のときだけ表示）。 */
export function ModeChooser() {
  const [pending, start] = useTransition()
  const [picked, setPicked] = useState<'simple' | 'pro' | null>(null)
  const [gone, setGone] = useState(false)

  function choose(mode: 'simple' | 'pro') {
    setPicked(mode)
    setGone(true) // 選択後は即カードを畳む
    start(async () => {
      await setUiMode(mode)
      window.location.reload()
    })
  }

  if (gone) return null

  return (
    <div className="card mb-8 p-6">
      <h2 className="text-lg" style={{ fontWeight: 800 }}>どちらで使いますか？</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
        あとから設定でいつでも切り替えられます。
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choose('simple')}
          disabled={pending}
          className="rounded-xl border p-4 text-left transition-colors hover:bg-[var(--accent-tint)]"
          style={{ borderColor: picked === 'simple' ? 'var(--color-ember)' : 'var(--line-strong)' }}
        >
          <div className="text-base" style={{ fontWeight: 800 }}>🔰 かんたんモード</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            まず楽しみたい人向け。フレーバー選びと味わい中心のシンプル表示。投稿もかんたん。
          </p>
        </button>
        <button
          type="button"
          onClick={() => choose('pro')}
          disabled={pending}
          className="rounded-xl border p-4 text-left transition-colors hover:bg-[var(--accent-tint)]"
          style={{ borderColor: picked === 'pro' ? 'var(--color-ember)' : 'var(--line-strong)' }}
        >
          <div className="text-base" style={{ fontWeight: 800 }}>🛠 プロモード</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            作り手・研究向け。熱管理カーブ・器具・蒸らし・練習ログまで、すべての機能が使えます。
          </p>
        </button>
      </div>
    </div>
  )
}
