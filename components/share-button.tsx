'use client'

import { useState } from 'react'

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} — MixHub`, url })
        return
      } catch {
        // ユーザーがキャンセル等 → フォールバックへ
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

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
      style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash)', fontWeight: 600 }}
    >
      <span aria-hidden>{copied ? '✅' : '🔗'}</span>
      {copied ? 'コピーしました' : 'シェア'}
    </button>
  )
}
