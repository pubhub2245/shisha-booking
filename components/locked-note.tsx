'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockMix } from '@/actions/unlock'

/** 有料ノートのロック表示（ぼかし＋鍵＋解錠ボタン）。解錠は決済連携までスタブ。 */
export function LockedNote({
  mixId,
  title,
  icon,
  price,
  isAuthed,
}: {
  mixId: string
  title: string
  icon: string
  price: number | null
  isAuthed: boolean
}) {
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onUnlock() {
    if (!isAuthed) {
      router.push(`/login?next=/mix/${mixId}`)
      return
    }
    setMsg(null)
    startTransition(async () => {
      const res = await unlockMix(mixId)
      if ('error' in res) setMsg(res.error)
      else if ('url' in res) window.location.href = res.url // Stripe Checkout へ
      else router.refresh()
    })
  }

  return (
    <div className="card relative overflow-hidden p-5">
      {/* ぼかしたダミー中身 */}
      <div aria-hidden className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.5 }}>
        <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>{icon} {title}</div>
        <div className="h-3 w-3/4 rounded" style={{ background: 'var(--line-strong)' }} />
        <div className="mt-2 h-3 w-2/3 rounded" style={{ background: 'var(--line-strong)' }} />
        <div className="mt-2 h-16 w-full rounded" style={{ background: 'var(--line-strong)' }} />
      </div>

      {/* オーバーレイ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        style={{ background: 'var(--surface-blur)', backdropFilter: 'blur(1px)' }}>
        <div className="text-2xl" aria-hidden>🔒</div>
        <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
          {title}（有料ノート）
        </div>
        <button
          type="button"
          onClick={onUnlock}
          disabled={pending}
          className="btn btn-ember text-sm"
        >
          {price != null ? `¥${price} で解錠` : '解錠する'}
        </button>
        {msg && <p className="text-xs" style={{ color: 'var(--color-ember-deep)' }}>{msg}</p>}
      </div>
    </div>
  )
}
