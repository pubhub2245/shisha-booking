'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { transferShopOwnership } from '@/actions/shop'

/** オーナー用：承認済みスタッフにオーナー権限を譲渡する（確認つき） */
export function TransferOwnerButton({
  shopId,
  userId,
  name,
}: {
  shopId: string
  userId: string
  name: string
}) {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onClick() {
    const ok = window.confirm(
      `「${name}」にオーナー権限を譲渡します。\n\nあなたはスタッフになり、承認・店舗情報の編集・権限譲渡ができなくなります。よろしいですか？`
    )
    if (!ok) return
    setErr(null)
    startTransition(async () => {
      const res = await transferShopOwnership(shopId, userId)
      if ('error' in res) setErr(res.error)
      else router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-xs"
        style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
      >
        {pending ? '譲渡中…' : 'オーナーを譲渡'}
      </button>
      {err && <span className="text-[0.68rem]" style={{ color: 'var(--color-ember-deep)' }}>{err}</span>}
    </span>
  )
}
