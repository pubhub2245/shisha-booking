'use client'

import { BOWL_OPTIONS, bowlOption } from '@/lib/heat'
import { BowlIcon } from '@/components/bowl-icon'
import { CardPicker } from '@/components/card-picker'

/** ボウルを写真的なカードで選ぶピッカー。選んだら他は畳まれる。 */
export function BowlPicker({ name = 'bowl_type', defaultValue = '' }: { name?: string; defaultValue?: string }) {
  return (
    <CardPicker
      name={name}
      options={BOWL_OPTIONS}
      defaultValue={defaultValue}
      iconSize={38}
      renderIcon={(icon, size) => <BowlIcon type={icon} size={size} />}
      renderDetail={(v) => (
        <p className="text-xs" style={{ color: 'var(--color-ash)' }}>{bowlOption(v)?.desc}</p>
      )}
    />
  )
}
