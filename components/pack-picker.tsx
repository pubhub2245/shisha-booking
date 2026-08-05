'use client'

import { PACK_OPTIONS, packOption } from '@/lib/heat'
import { PackIcon } from '@/components/pack-icon'
import { CardPicker } from '@/components/card-picker'
import { SourceLine } from '@/components/source-line'
import { PACK_SOURCES } from '@/lib/sources'

/** フレーバーの盛り方をイラスト付きカードで選ぶピッカー。選んだら他は畳まれる。 */
export function PackPicker({ name = 'pack_style', defaultValue = '' }: { name?: string; defaultValue?: string }) {
  return (
    <>
      <CardPicker
        name={name}
        options={PACK_OPTIONS}
        defaultValue={defaultValue}
        iconSize={40}
        renderIcon={(icon, size) => <PackIcon type={icon} size={size} />}
        renderDetail={(v) => (
          <p className="text-xs" style={{ color: 'var(--color-ash)' }}>{packOption(v)?.desc}</p>
        )}
      />
      <SourceLine sources={PACK_SOURCES} className="mt-2" />
    </>
  )
}
