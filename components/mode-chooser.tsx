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
      <h2 className="text-lg" style={{ fontWeight: 800 }}>どのくらい詳しく表示しますか？</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
        あなたの「腕前」ではなく、<b>見せる情報量</b>の設定です。上部からいつでも切り替えられます。
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choose('simple')}
          disabled={pending}
          className="rounded-xl border p-4 text-left transition-colors hover:bg-[var(--accent-tint)]"
          style={{ borderColor: picked === 'simple' ? 'var(--color-ember)' : 'var(--line-strong)' }}
        >
          <div className="text-base" style={{ fontWeight: 800 }}>シンプル表示</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            まずは王道と味わい中心。結論がすぐ分かる。詳しい作り方は各ページで「詳しく見る」から開けます。
          </p>
        </button>
        <button
          type="button"
          onClick={() => choose('pro')}
          disabled={pending}
          className="rounded-xl border p-4 text-left transition-colors hover:bg-[var(--accent-tint)]"
          style={{ borderColor: picked === 'pro' ? 'var(--color-ember)' : 'var(--line-strong)' }}
        >
          <div className="text-base" style={{ fontWeight: 800 }}>詳細表示</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            熱管理カーブ・器具・蒸らし・ランキングまで最初から全部見せます。作り込みたい人向け。
          </p>
        </button>
      </div>
    </div>
  )
}
