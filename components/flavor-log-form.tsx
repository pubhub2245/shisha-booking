'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addFlavorLog, type FlavorLogState } from '@/actions/flavor-log'
import { HMS_OPTIONS, CHARCOAL_OPTIONS, PACK_OPTIONS } from '@/lib/heat'

export function FlavorLogForm({
  flavorId,
  shops = [],
}: {
  flavorId: string
  shops?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState<FlavorLogState, FormData>(addFlavorLog, null)
  const formRef = useRef<HTMLFormElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    if (state && 'ok' in state) {
      formRef.current?.reset()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(0)
      if (detailsRef.current) detailsRef.current.open = false
      router.refresh()
    }
  }, [state, router])

  return (
    <details ref={detailsRef} className="card p-4">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
          ＋ 今日のこすりを記録
        </span>
      </summary>
      <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="flavor_id" value={flavorId} />
        <input type="hidden" name="rating" value={rating} />

        {state && 'error' in state && (
          <p className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>{state.error}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label>日付</label>
            <input type="date" name="logged_at" />
          </div>
          <div className="field">
            <label>蒸らし時間（分）</label>
            <input name="steep_minutes" inputMode="decimal" placeholder="例：7" />
          </div>
          <div className="field">
            <label>到達火力（1〜100）</label>
            <input name="steep_heat" inputMode="numeric" placeholder="例：70" />
          </div>
          <div className="field">
            <label>HMS</label>
            <select name="hms_type" defaultValue="">
              <option value="">未設定</option>
              {HMS_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>炭</label>
            <select name="charcoal_type" defaultValue="">
              <option value="">未設定</option>
              {CHARCOAL_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>盛り方</label>
            <select name="pack_style" defaultValue="">
              <option value="">未設定</option>
              {PACK_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>出来（★で評価）</label>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n === rating ? 0 : n)}
                aria-label={`${n}つ星`}
                className="text-2xl leading-none transition-transform hover:scale-110"
                style={{ color: n <= rating ? '#f5a623' : 'var(--line-strong)' }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>味の出方・気づき</label>
          <textarea name="result_note" placeholder="例：60台前半は青りんご寄り、70超で甘みが立つ。灰は10分で一度落とす。" maxLength={500} />
        </div>
        <div className="field">
          <label>前回からの変更点（任意）</label>
          <input name="change_note" placeholder="例：到達火力を5上げた／蒸らしを1分短く" maxLength={300} />
        </div>

        {shops.length > 0 && (
          <div className="field">
            <label>賄いとしてお店に記録（任意）</label>
            <select name="shop_id" defaultValue="">
              <option value="">共有しない（自分だけの記録）</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name} に共有</option>
              ))}
            </select>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              選ぶと、この記録がお店のオーナー・スタッフに見えます（賄いシーシャの練習記録）。
            </p>
          </div>
        )}

        <button type="submit" disabled={pending} className="btn btn-ember self-end text-sm">
          {pending ? '記録中…' : '記録する'}
        </button>
      </form>
    </details>
  )
}
