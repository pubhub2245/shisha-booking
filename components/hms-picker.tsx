'use client'

import { HMS_OPTIONS } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'
import { CardPicker } from '@/components/card-picker'

/**
 * HMS を写真的なカードで選ぶピッカー。選んだら他は畳まれる。「その他」で自由入力欄が出る。
 *
 * 種類ごとの解説や「相性の良いボウル」の推奨はここには出さない。
 * これは実際に作る人が自分の器材を選ぶ入力欄で、解説は /hms/[type] 側の役割。
 */
export function HmsPicker({
  name = 'hms_type',
  defaultValue = '',
  otherName = 'hms_other',
  otherDefault = '',
}: {
  name?: string
  defaultValue?: string
  otherName?: string
  otherDefault?: string
}) {
  return (
    <CardPicker
      name={name}
      options={HMS_OPTIONS}
      defaultValue={defaultValue}
      aliasMap={{ kaloud: 'lotus' }}
      otherName={otherName}
      otherDefault={otherDefault}
      otherPlaceholder="HMSの名称を入力（例：〇〇 ヒートマネジメント）"
      renderIcon={(icon, size) => <HmsIcon type={icon} size={size} />}
    />
  )
}
