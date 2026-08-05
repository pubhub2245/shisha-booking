'use client'

import { useState } from 'react'
import { HMS_OPTIONS } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'

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
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash)' }}>
          {HMS_OPTIONS.find((o) => o.v === selected)?.desc}
        </p>
      )}
    </div>
  )
}
