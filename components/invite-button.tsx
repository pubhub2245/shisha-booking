'use client'

import { useState } from 'react'

/** アプリを友達に教える（Web Share / クリップボードコピー）。 */
export function InviteButton({ className = 'btn btn-ghost text-sm' }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const url = window.location.origin
    const shareData = {
      title: 'MixHub — シーシャのミックス図鑑',
      text: '美味しいシーシャのミックスと作り方が集まる図鑑アプリ「MixHub」',
      url,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // キャンセル時などはコピーにフォールバック
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // noop
    }
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {copied ? '✓ リンクをコピーしました' : '🔗 友達に教える'}
    </button>
  )
}
