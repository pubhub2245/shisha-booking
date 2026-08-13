'use client'

import { useTransition } from 'react'
import { setUiMode } from '@/actions/profile'

/** ヘッダー常設の即切替スイッチ（シンプル / 詳細）。ユーザーを二分せず"見せる情報量"を切り替える。 */
export function ModeSwitch({ mode }: { mode: 'simple' | 'pro' }) {
  const [pending, start] = useTransition()

  function set(m: 'simple' | 'pro') {
    if (m === mode || pending) return
    start(async () => {
      await setUiMode(m)
      window.location.reload()
    })
  }

  const seg = (m: 'simple' | 'pro') =>
    m === mode
      ? { background: 'var(--color-ember)', color: '#fff', fontWeight: 700 }
      : { color: 'var(--color-ash)' }

  return (
    <div
      className="inline-flex items-center rounded-full border p-0.5"
      style={{ borderColor: 'var(--line-strong)' }}
      role="group"
      aria-label="表示の詳しさを切り替え"
      title="シンプル / 詳細（見せる情報量）を切り替え"
    >
      <button
        type="button"
        onClick={() => set('simple')}
        disabled={pending}
        aria-pressed={mode === 'simple'}
        className="rounded-full px-3 py-1 text-xs transition-colors"
        style={seg('simple')}
      >
        シンプル
      </button>
      <button
        type="button"
        onClick={() => set('pro')}
        disabled={pending}
        aria-pressed={mode === 'pro'}
        className="rounded-full px-3 py-1 text-xs transition-colors"
        style={seg('pro')}
      >
        詳細
      </button>
    </div>
  )
}
