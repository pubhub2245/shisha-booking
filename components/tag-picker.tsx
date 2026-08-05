'use client'

import { useState } from 'react'
import { TASTE_TAGS, TYPE_TAGS } from '@/lib/tags'

/** 味わいタグを選択式で選ぶ（複数可）。選択値は hidden input で送信。 */
export function TagPicker({ name = 'taste_tags', defaultValue = [] }: { name?: string; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue)

  const toggle = (t: string) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))

  const rows: { label: string; tags: readonly string[] }[] = [
    { label: '味わい', tags: TASTE_TAGS },
    { label: '系統', tags: TYPE_TAGS },
  ]

  return (
    <div>
      {selected.map((t) => (
        <input key={t} type="hidden" name={name} value={t} />
      ))}
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>{row.label}</span>
            {row.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                aria-pressed={selected.includes(t)}
                className={`chip ${selected.includes(t) ? 'chip-active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
