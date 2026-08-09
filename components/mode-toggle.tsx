'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setUiMode } from '@/actions/profile'

/** 表示モードを切り替えるボタン（初心者=simple / プロ=pro）。 */
export function ModeToggle({
  target,
  label,
  className = 'btn btn-ghost text-sm',
}: {
  target: 'simple' | 'pro'
  label: string
  className?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function go() {
    start(async () => {
      await setUiMode(target)
      router.refresh()
    })
  }

  return (
    <button type="button" onClick={go} disabled={pending} className={className}>
      {pending ? '切り替え中…' : label}
    </button>
  )
}
