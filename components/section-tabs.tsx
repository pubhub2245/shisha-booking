'use client'

import { useState, type ReactNode } from 'react'

export type SectionTab = { id: string; label: string; content: ReactNode }

/**
 * 汎用のセクションタブ。長くなりがちな下部コンテンツ（評価・ネーミング・コメント等）を
 * 1本に束ねて縦の圧を下げる。全パネルはDOMに残す（hidden切替）ためSEO・アンカーも保てる。
 * タブが1つしかないときはタブバーを出さずにそのまま表示する。
 */
export function SectionTabs({ tabs, initial }: { tabs: SectionTab[]; initial?: string }) {
  const valid = tabs.filter(Boolean)
  const [active, setActive] = useState(initial && valid.some((t) => t.id === initial) ? initial : valid[0]?.id)

  if (valid.length === 0) return null
  if (valid.length === 1) return <div className="mt-8">{valid[0].content}</div>

  return (
    <div className="mt-8">
      <div role="tablist" className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
        {valid.map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className="rounded-full px-3.5 py-1.5 text-sm transition-colors"
              style={
                on
                  ? { background: 'var(--color-ember)', color: '#fff', fontWeight: 700 }
                  : { background: 'var(--color-smoke-850)', color: 'var(--color-ash)', border: '1px solid var(--line-strong)' }
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {valid.map((t) => (
        <div key={t.id} hidden={t.id !== active} className="mt-5">
          {t.content}
        </div>
      ))}
    </div>
  )
}
