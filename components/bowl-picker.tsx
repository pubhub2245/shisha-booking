'use client'

import { BOWL_OPTIONS } from '@/lib/heat'
import { BowlIcon } from '@/components/bowl-icon'
import { CardPicker } from '@/components/card-picker'

/**
 * ボウルを写真的なカードで選ぶピッカー。選んだら他は畳まれる。
 *
 * 選んだ種類の解説（どんなフレーバーと相性が良いか等）はここには出さない。
 * これは実際に作る人が使う入力欄で、種類ごとの説明は /bowl/[type] 側の役割。
 */
export function BowlPicker({ name = 'bowl_type', defaultValue = '' }: { name?: string; defaultValue?: string }) {
  return (
    <CardPicker
      name={name}
      options={BOWL_OPTIONS}
      defaultValue={defaultValue}
      iconSize={38}
      renderIcon={(icon, size) => <BowlIcon type={icon} size={size} />}
    />
  )
}
