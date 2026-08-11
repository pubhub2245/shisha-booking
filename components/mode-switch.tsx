'use client'

import { useTransition } from 'react'
import { setUiMode } from '@/actions/profile'

/** ヘッダー常設の即切替スイッチ（🔰 かんたん / 🛠 プロ）。 */
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
      aria-label="表示モードの切り替え"
      title="かんたん / プロ を切り替え"
    >
      <button
        type="button"
        onClick={() => set('simple')}
        disabled={pending}
        aria-pressed={mode === 'simple'}
        className="rounded-full px-2 py-1 text-xs transition-colors"
        style={seg('simple')}
      >
        🔰<span className="ml-1 hidden sm:inline">かんたん</span>
      </button>
      <button
        type="button"
        onClick={() => set('pro')}
        disabled={pending}
        aria-pressed={mode === 'pro'}
        className="rounded-full px-2 py-1 text-xs transition-colors"
        style={seg('pro')}
      >
        🛠<span className="ml-1 hidden sm:inline">プロ</span>
      </button>
    </div>
  )
}
