'use client'

import { useState } from 'react'

/** アプリを友達に教える（Web Share / クリップボードコピー）。 */
export function InviteButton({ className = 'btn btn-ghost text-sm' }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const url = window.location.origin
    const shareData = {
      title: '煙道 ENDO — 王道シーシャ図鑑',
      text: '1つのフレーバーを、どう作るか。作り方を試して比べられるアプリ「煙道 ENDO」',
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
      {copied ? '✓ リンクをコピーしました' : '友達に教える'}
    </button>
  )
}
