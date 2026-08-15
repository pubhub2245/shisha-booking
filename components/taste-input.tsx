'use client'

import { useState, useTransition } from 'react'
import { saveTasteEvaluation } from '@/actions/taste'
import { TASTE_AXES, type TasteAxis } from '@/lib/taste'
import { trackEvent } from '@/lib/analytics'

type Values = Partial<Record<TasteAxis, number>>

/**
 * 味の印象（5軸）の任意入力。「吸った」→「どうだった？」の後に置く追加導線で、
 * 必須にしない。全項目を求めず、分かる軸だけ選べばよい。
 */
export function TasteInput({
  experienceId,
  mixId,
  initial,
  onSaved,
}: {
  experienceId: string
  /** 計測用。味覚の実値は送らず、入力された軸数だけを送る */
  mixId: string
  initial?: Values
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Values>(initial ?? {})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const hasAny = Object.values(values).some((v) => v != null)

  function pick(axis: TasteAxis, v: number) {
    // もう一度同じ値を押したら選択解除（未入力に戻せる）
    setValues((s) => ({ ...s, [axis]: s[axis] === v ? undefined : v }))
    setSaved(false)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await saveTasteEvaluation(experienceId, values)
      if ('error' in res) setError(res.error)
      else {
        setSaved(true)
        // 味の実値は Analytics へ送らない。入力された軸数(1〜5)だけを送る。
        trackEvent('taste_submitted', {
          mix_id: mixId,
          axes: Object.values(values).filter((v) => v != null).length,
        })
        onSaved?.()
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs underline underline-offset-2"
        style={{ color: 'var(--color-ash-dim)' }}
      >
        味の印象も残す（任意）
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
      <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        分かるものだけでかまいません。
      </p>

      {TASTE_AXES.map((axis) => (
        <div key={axis.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm" style={{ fontWeight: 700 }}>{axis.label}</span>
            <span className="text-[0.65rem]" style={{ color: 'var(--color-ash-dim)' }}>
              {axis.low} ← → {axis.high}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => {
              const active = values[axis.key] === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => pick(axis.key, v)}
                  aria-pressed={active}
                  aria-label={`${axis.label} ${v}`}
                  // スマホで押しやすい大きさを確保する
                  className="min-h-11 flex-1 rounded-lg border text-sm transition-colors"
                  style={{
                    borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                    background: active ? 'var(--accent-tint)' : 'transparent',
                    color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
                    fontWeight: active ? 800 : 500,
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-xs" style={{ color: 'var(--color-seal)' }}>{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !hasAny}
          className="btn btn-ember text-sm"
        >
          {pending ? '保存中…' : saved ? '保存しました' : '保存する'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs"
          style={{ color: 'var(--color-ash-dim)' }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
