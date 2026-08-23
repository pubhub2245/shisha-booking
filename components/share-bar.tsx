'use client'

import { useState } from 'react'

/**
 * シェア導線（X / LINE / コピー・ネイティブ共有）。
 * text は本文、url は共有先。バイラルの心臓部なので分かりやすく前面に置く。
 */
export function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`

  async function share() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text, url })
        return
      } catch {
        // キャンセル → コピーへ
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // noop
    }
  }

  // 共有は最も低い視覚優先度。塗りをやめて細い罫のみにし、記録系より弱く見せる。
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors'
  const quiet = { border: '1px solid var(--line)', color: 'var(--color-ash-dim)', fontWeight: 500 } as const

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        style={quiet}
        aria-label="Xでシェア"
      >
        𝕏
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        style={quiet}
        aria-label="LINEでシェア"
      >
        LINE
      </a>
      <button
        type="button"
        onClick={share}
        className={base}
        style={quiet}
      >
        <span aria-hidden>{copied ? '✓' : ''}</span>
        {copied ? 'コピーしました' : 'リンク'}
      </button>
    </div>
  )
}
