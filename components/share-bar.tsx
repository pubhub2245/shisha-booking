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

  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-transform hover:scale-[1.03]'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        style={{ background: '#000', color: '#fff', fontWeight: 700 }}
        aria-label="Xでシェア"
      >
        𝕏 でシェア
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        style={{ background: '#06c755', color: '#fff', fontWeight: 700 }}
        aria-label="LINEでシェア"
      >
        LINE
      </a>
      <button
        type="button"
        onClick={share}
        className={base}
        style={{ border: '1px solid var(--line-strong)', color: 'var(--color-ash)', fontWeight: 600 }}
      >
        <span aria-hidden>{copied ? '✅' : '🔗'}</span>
        {copied ? 'コピーしました' : 'リンク'}
      </button>
    </div>
  )
}
