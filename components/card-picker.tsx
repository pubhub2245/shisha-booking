'use client'

import { useState, type ReactNode } from 'react'

export type PickerOption = { v: string; l: string; en?: string; icon: string }

/**
 * イラスト付きカードで1つ選ぶ汎用ピッカー。
 * - 選択すると他の候補は畳まれ、選択中のカード＋「変更」だけになる（見やすさ重視）。
 * - 「変更」で再度グリッドを開いて選び直せる。
 * - otherName を渡すと、その他選択時に自由入力欄を表示。
 * - renderDetail で選択中の説明などを表示。
 */
export function CardPicker({
  name,
  options,
  defaultValue = '',
  iconSize = 40,
  renderIcon,
  renderDetail,
  otherName,
  otherDefault = '',
  otherPlaceholder = '名称を入力',
  aliasMap,
}: {
  name: string
  options: readonly PickerOption[]
  defaultValue?: string
  iconSize?: number
  renderIcon: (icon: string, size: number) => ReactNode
  renderDetail?: (v: string) => ReactNode
  otherName?: string
  otherDefault?: string
  otherPlaceholder?: string
  aliasMap?: Record<string, string>
}) {
  const norm = (aliasMap && aliasMap[defaultValue]) || defaultValue
  const [selected, setSelected] = useState(norm)
  const [other, setOther] = useState(otherDefault)
  const [expanded, setExpanded] = useState(!norm)
  const sel = options.find((o) => o.v === selected) || null

  return (
    <div>
      <input type="hidden" name={name} value={selected} />

      {!expanded && sel ? (
        // 折り畳み時：選択中のカード＋「変更」
        <div
          className="flex items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)' }}
        >
          <span className="shrink-0" style={{ color: 'var(--color-ember-hot)' }}>{renderIcon(sel.icon, iconSize)}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
              {selected === 'other' && other ? other : sel.l}
            </div>
            {sel.en && selected !== 'other' && (
              <div className="text-[0.62rem]" style={{ color: 'var(--color-ash-dim)' }}>{sel.en}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash)', background: 'var(--color-smoke-850)' }}
          >
            変更
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((o) => {
            const active = selected === o.v
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => {
                  const next = active ? '' : o.v
                  setSelected(next)
                  if (next) setExpanded(false)
                }}
                aria-pressed={active}
                className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors"
                style={{
                  borderColor: active ? 'var(--color-ember)' : 'var(--line-strong)',
                  background: active ? 'var(--accent-tint)' : 'transparent',
                  color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
                }}
              >
                {renderIcon(o.icon, iconSize)}
                <span className="text-xs leading-tight" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{o.l}</span>
                {o.en && <span className="text-[0.6rem] leading-tight" style={{ color: 'var(--color-ash-dim)' }}>{o.en}</span>}
              </button>
            )
          })}
        </div>
      )}

      {otherName && selected === 'other' && (
        <input
          name={otherName}
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder={otherPlaceholder}
          className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
        />
      )}

      {selected && selected !== 'other' && renderDetail && <div className="mt-2">{renderDetail(selected)}</div>}
    </div>
  )
}
