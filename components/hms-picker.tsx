'use client'

import { HMS_OPTIONS, hmsOption, hmsBowls } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'
import { BowlIcon } from '@/components/bowl-icon'
import { CardPicker } from '@/components/card-picker'

/** HMS を写真的なカードで選ぶピッカー。選んだら他は畳まれる。「その他」で自由入力欄が出る。 */
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
      renderDetail={(v) => {
        const opt = hmsOption(v)
        const bowls = hmsBowls(v)
        return (
          <>
            <p className="text-xs" style={{ color: 'var(--color-ash)' }}>{opt?.desc}</p>
            {(bowls.length > 0 || opt?.bowlNote) && (
              <div className="mt-2 rounded-lg border p-2.5" style={{ borderColor: 'var(--line)', background: 'var(--accent-tint)' }}>
                <p className="text-[0.68rem]" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>相性の良いボウル</p>
                {bowls.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {bowls.map((b) => (
                      <span
                        key={b.v}
                        className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[0.68rem]"
                        style={{ borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
                      >
                        <span style={{ color: 'var(--color-ember-hot)' }}><BowlIcon type={b.icon} size={16} /></span>
                        {b.l}
                      </span>
                    ))}
                  </div>
                )}
                {opt?.bowlNote && (
                  <p className="mt-1.5 text-[0.68rem] leading-snug" style={{ color: 'var(--color-ash)' }}>{opt.bowlNote}</p>
                )}
              </div>
            )}
          </>
        )
      }}
    />
  )
}
