'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestJoinShop, leaveShop } from '@/actions/shop'

type JoinState = 'none' | 'pending' | 'approved'

export function ShopJoinButton({
  shopId,
  initialState,
  isAuthed,
}: {
  shopId: string
  initialState: JoinState
  isAuthed: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<JoinState>(initialState)
  const [pending, startTransition] = useTransition()

  if (state === 'approved') {
    return (
      <span className="chip chip-active inline-flex items-center gap-1">
        <span aria-hidden>✓</span> 所属スタッフ
      </span>
    )
  }

  function join() {
    if (!isAuthed) {
      router.push(`/login?next=/shop/${shopId}`)
      return
    }
    setState('pending')
    startTransition(async () => {
      const res = await requestJoinShop(shopId)
      if ('error' in res) setState('none')
    })
  }

  function cancel() {
    setState('none')
    startTransition(async () => {
      const res = await leaveShop(shopId)
      if ('error' in res) setState('pending')
    })
  }

  if (state === 'pending') {
    return (
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="btn btn-ghost text-sm"
        title="申請を取り消す"
      >
        🕓 承認待ち（取消）
      </button>
    )
  }

  return (
    <button type="button" onClick={join} disabled={pending} className="btn btn-ember text-sm">
      このお店で働いています（参加申請）
    </button>
  )
}
