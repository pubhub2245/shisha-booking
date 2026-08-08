'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rateFlavor } from '@/actions/social'

/** フレーバーの★評価ウィジェット（1-5・楽観更新）。 */
export function FlavorRating({
  flavorId,
  initialAvg,
  initialCount,
  initialMine,
  isAuthed,
}: {
  flavorId: string
  initialAvg: number
  initialCount: number
  initialMine: number
  isAuthed: boolean
}) {
  const router = useRouter()
  const [avg, setAvg] = useState(initialAvg)
  const [count, setCount] = useState(initialCount)
  const [mine, setMine] = useState(initialMine)
  const [hover, setHover] = useState(0)
  const [pending, startTransition] = useTransition()

  function rate(n: number) {
    if (!isAuthed) {
      router.push(`/login?next=/flavor/${flavorId}`)
      return
    }
    setMine(n)
    startTransition(async () => {
      const res = await rateFlavor(flavorId, n)
      if (!('error' in res)) {
        setAvg(res.avg)
        setCount(res.count)
        setMine(res.mine)
      }
    })
  }

  const display = hover || mine

  return (
    <div>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            disabled={pending}
            aria-label={`${n}つ星をつける`}
            className="text-2xl leading-none transition-transform hover:scale-110"
            style={{ color: n <= display ? '#f5a623' : 'var(--line-strong)' }}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        {count > 0 ? `平均 ${avg.toFixed(1)} / 5（${count}件）` : 'まだ評価がありません。最初の評価を！'}
        {mine > 0 && ` ・ あなた：★${mine}`}
      </p>
    </div>
  )
}
