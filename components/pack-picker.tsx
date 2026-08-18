'use client'

import { PACK_OPTIONS } from '@/lib/heat'
import { PackIcon } from '@/components/pack-icon'
import { CardPicker } from '@/components/card-picker'

/**
 * フレーバーの盛り方をイラスト付きカードで選ぶピッカー。選んだら他は畳まれる。
 * 盛り方ごとの解説はここには出さない（実際に作る人が使う入力欄なので）。
 */
export function PackPicker({ name = 'pack_style', defaultValue = '' }: { name?: string; defaultValue?: string }) {
  return (
    <CardPicker
      name={name}
      options={PACK_OPTIONS}
      defaultValue={defaultValue}
      iconSize={40}
      renderIcon={(icon, size) => <PackIcon type={icon} size={size} />}
    />
  )
}
