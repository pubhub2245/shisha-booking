'use client'

import { useState, useTransition } from 'react'
import { toggleShopFlavor } from '@/actions/shop-inventory'

export function ShopFlavorChip({
  flavorId,
  label,
  initialInStock,
}: {
  flavorId: string
  label: string
  initialInStock: boolean
}) {
  const [inStock, setInStock] = useState(initialInStock)
  const [pending, startTransition] = useTransition()

  function onClick() {
    const next = !inStock
    setInStock(next)
    startTransition(async () => {
      const res = await toggleShopFlavor(flavorId)
      if ('error' in res) setInStock(!next)
      else setInStock(res.inStock)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={inStock}
      className={`chip ${inStock ? 'chip-active' : ''}`}
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      <span aria-hidden className="mr-1">{inStock ? '✓' : '＋'}</span>
      {label}
    </button>
  )
}
