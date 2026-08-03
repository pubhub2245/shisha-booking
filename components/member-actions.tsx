'use client'

import { useState, useTransition } from 'react'
import { approveMember, removeMember } from '@/actions/shop'

/** オーナー用：参加申請の承認 / 却下・除名ボタン */
export function MemberActions({
  shopId,
  userId,
  mode,
}: {
  shopId: string
  userId: string
  mode: 'pending' | 'staff'
}) {
  const [done, setDone] = useState<null | 'approved' | 'removed'>(null)
  const [pending, startTransition] = useTransition()

  if (done === 'approved') return <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>承認しました</span>
  if (done === 'removed') return <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除しました</span>

  function onApprove() {
    startTransition(async () => {
      const res = await approveMember(shopId, userId)
      if (!('error' in res)) setDone('approved')
    })
  }
  function onRemove() {
    startTransition(async () => {
      const res = await removeMember(shopId, userId)
      if (!('error' in res)) setDone('removed')
    })
  }

  return (
    <div className="flex items-center gap-2">
      {mode === 'pending' && (
        <button type="button" onClick={onApprove} disabled={pending} className="btn btn-ember text-xs">
          承認
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        className="text-xs"
        style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}
      >
        {mode === 'pending' ? '却下' : '除名'}
      </button>
    </div>
  )
}
