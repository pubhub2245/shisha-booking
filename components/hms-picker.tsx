'use client'

import { useState } from 'react'
import { HMS_OPTIONS, hmsOption, hmsBowls } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'
import { BowlIcon } from '@/components/bowl-icon'

/** HMS を写真的なカードで選ぶピッカー。選択値は hidden input で送信。「その他」で自由入力欄が出る。 */
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
  // 旧値 kaloud を lotus に寄せる
  const normalized = defaultValue === 'kaloud' ? 'lotus' : defaultValue
  const [selected, setSelected] = useState(normalized)
  const [other, setOther] = useState(otherDefault)

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HMS_OPTIONS.map((o) => {
          const active = selected === o.v
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => setSelected(active ? '' : o.v)}
              aria-pressed={active}
              className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors"
              style={{
                borderColor: active ? 'var(--color-ember)' : 'var(--line-strong)',
                background: active ? 'var(--accent-tint)' : 'transparent',
                color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
              }}
            >
              <HmsIcon type={o.icon} size={40} />
              <span className="text-xs leading-tight" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{o.l}</span>
              {o.en && <span className="text-[0.62rem] leading-tight" style={{ color: 'var(--color-ash-dim)' }}>{o.en}</span>}
            </button>
          )
        })}
      </div>
      {selected === 'other' && (
        <input
          name={otherName}
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="HMSの名称を入力（例：〇〇 ヒートマネジメント）"
          className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ background: '#fff', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
      )}
      {selected && selected !== 'other' && (
        <div className="mt-2">
          <p className="text-xs" style={{ color: 'var(--color-ash)' }}>
            {hmsOption(selected)?.desc}
          </p>
          {(() => {
            const bowls = hmsBowls(selected)
            const note = hmsOption(selected)?.bowlNote
            if (bowls.length === 0 && !note) return null
            return (
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
                {note && (
                  <p className="mt-1.5 text-[0.68rem] leading-snug" style={{ color: 'var(--color-ash)' }}>{note}</p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
