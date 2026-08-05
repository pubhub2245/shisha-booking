'use client'

import { useState } from 'react'
import { BOWL_OPTIONS } from '@/lib/heat'
import { BowlIcon } from '@/components/bowl-icon'

/** ボウルを写真的なカードで選ぶピッカー。選択値は hidden input で送信。 */
export function BowlPicker({ name = 'bowl_type', defaultValue = '' }: { name?: string; defaultValue?: string }) {
  const [selected, setSelected] = useState(defaultValue)

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BOWL_OPTIONS.map((o) => {
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
              <BowlIcon type={o.icon} size={38} />
              <span className="text-xs leading-tight" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{o.l}</span>
              {o.en && <span className="text-[0.6rem] leading-tight" style={{ color: 'var(--color-ash-dim)' }}>{o.en}</span>}
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash)' }}>
          {BOWL_OPTIONS.find((o) => o.v === selected)?.desc}
        </p>
      )}
    </div>
  )
}
