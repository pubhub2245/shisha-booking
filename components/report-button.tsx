'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reportContent } from '@/actions/social'

/** 不適切コンテンツの通報ボタン（ミックス）。 */
export function ReportButton({ mixId, isAuthed }: { mixId: string; isAuthed: boolean }) {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=/method/${mixId}`)
      return
    }
    const reason = window.prompt('通報の理由を教えてください（任意）。\n例：不適切・スパム・権利侵害など')
    if (reason === null) return
    startTransition(async () => {
      const res = await reportContent({ mixId, reason })
      if ('ok' in res) setDone(true)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || done}
      className="text-xs transition-colors hover:text-[var(--color-ember-hot)]"
      style={{ color: 'var(--color-ash-dim)' }}
    >
      {done ? '✓ 通報しました' : '通報'}
    </button>
  )
}
