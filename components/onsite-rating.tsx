'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitOnsiteCheckin, submitOnsiteRating } from '@/actions/onsite'
import type { OnsiteContext } from '@/lib/types/database'

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={onChange ? () => onChange(n) : undefined}
          aria-label={`${n}点`}
          disabled={!onChange}
          className={onChange ? 'cursor-pointer text-2xl leading-none transition-transform hover:scale-110' : 'text-2xl leading-none'}
          style={{ color: n <= value ? '#f5a623' : 'var(--line-strong)' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function untilText(availableAt: string, now: number): string {
  const t = new Date(availableAt).getTime()
  const diff = t - now
  if (diff <= 0) return 'まもなく'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h >= 1) return `あと約${h}時間`
  return `あと約${Math.max(1, m)}分`
}

export function OnsiteRating({
  mixId,
  ctx,
  isAuthed,
}: {
  mixId: string
  ctx: OnsiteContext
  isAuthed: boolean
}) {
  const router = useRouter()
  const [count, setCount] = useState(ctx.count)
  const [state, setState] = useState(ctx.myState)
  const [availableAt, setAvailableAt] = useState(ctx.availableAt)
  const [myScore, setMyScore] = useState(ctx.myScore)
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [locating, setLocating] = useState(false)
  const [pending, start] = useTransition()
  // カウントダウンはマウント後にのみ評価する（SSRとクライアント初回描画で
  // Date.now() がズレてハイドレーション不一致になるのを防ぐ）。1分ごとに更新。
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    // 初回はコミット後（rAF）に反映し、以降1分ごとに更新。effect 内での
    // 同期 setState を避けつつ、SSR/初回描画は null のまま揃える。
    const raf = requestAnimationFrame(() => setNow(Date.now()))
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
    }
  }, [])

  const shopNames = ctx.shops.map((s) => s.name).join('・')
  const busy = locating || pending

  function checkin() {
    if (!isAuthed) {
      router.push('/login?next=' + encodeURIComponent(`/method/${mixId}`))
      return
    }
    if (!('geolocation' in navigator)) {
      setMsg({ kind: 'err', text: 'この端末では位置情報を取得できません。' })
      return
    }
    setMsg(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        start(async () => {
          const res = await submitOnsiteCheckin(mixId, latitude, longitude)
          switch (res.status) {
            case 'checked_in':
            case 'already':
              setState('waiting')
              setAvailableAt(res.availableAt)
              setMsg({
                kind: 'ok',
                text:
                  res.status === 'checked_in'
                    ? '来店を記録しました！評価は24時間後からつけられます（店員さんのいない場所で、はしごして比べてからでOK）。'
                    : 'すでに来店チェックイン済みです。',
              })
              router.refresh()
              break
            case 'too_far':
              setMsg({ kind: 'err', text: `お店から約${res.distance}m 離れています（有効範囲 ${res.radius}m）。店内でお試しください。` })
              break
            case 'no_shop':
              setMsg({ kind: 'err', text: '投稿者のお店の位置がまだ登録されていないため、チェックインできません。' })
              break
            case 'own_mix':
              setMsg({ kind: 'err', text: '自分の投稿は評価できません。' })
              break
            case 'not_authed':
              router.push('/login?next=' + encodeURIComponent(`/method/${mixId}`))
              break
            default:
              setMsg({ kind: 'err', text: '記録に失敗しました。時間をおいて再度お試しください。' })
          }
        })
      },
      (err) => {
        setLocating(false)
        setMsg({
          kind: 'err',
          text:
            err.code === err.PERMISSION_DENIED
              ? '位置情報の利用が許可されていません。ブラウザの設定で許可してください。'
              : '位置情報を取得できませんでした。電波の良い場所で再度お試しください。',
        })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function rate() {
    if (score < 1) {
      setMsg({ kind: 'err', text: '星で点数を選んでください。' })
      return
    }
    setMsg(null)
    start(async () => {
      const res = await submitOnsiteRating(mixId, score, comment)
      switch (res.status) {
        case 'rated':
          setState('rated')
          setMyScore(score)
          setCount(res.count)
          setMsg({ kind: 'ok', text: '評価を記録しました。ありがとうございます！' })
          router.refresh()
          break
        case 'too_early':
          setState('waiting')
          setAvailableAt(res.availableAt)
          setMsg({ kind: 'err', text: 'まだ評価できません。来店の24時間後からです。' })
          break
        case 'not_checked_in':
          setState('none')
          setMsg({ kind: 'err', text: '先にお店で来店チェックインしてください。' })
          break
        case 'already':
          setState('rated')
          setMsg({ kind: 'err', text: 'すでに評価済みです。' })
          break
        default:
          setMsg({ kind: 'err', text: '評価の記録に失敗しました。時間をおいて再度お試しください。' })
      }
    })
  }

  return (
    <section>
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgb(178 59 46 / 0.30)', background: 'rgb(178 59 46 / 0.05)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base" style={{ fontWeight: 800 }}>📍 実地評価</h2>
          <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
            {ctx.avg != null ? `★${ctx.avg.toFixed(1)}・` : ''}{count}人が評価
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          お店で<b>来店チェックイン</b>したあと、<b>24時間後</b>から星で採点できます。
          店員さんのいない場所で、はしごして他店と比べてから、正直に評価できます。いいねより<b>重い一票</b>として王道の選出に効きます。
        </p>

        {ctx.shops.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            対象のお店：<b style={{ color: 'var(--color-cream)' }}>{shopNames}</b>
          </p>
        )}

        <div className="mt-3">
          {ctx.isOwn ? (
            <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>自分の投稿は評価できません。</p>
          ) : ctx.shops.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
              投稿者がまだお店の位置を登録していないため、評価はできません。
            </p>
          ) : state === 'rated' ? (
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
              ✓ 評価済み {myScore != null && <span>（あなたの評価 ★{myScore}）</span>}
            </div>
          ) : state === 'waiting' ? (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--line-strong)' }}>
              ✅ 来店を記録しました。<b>評価は{availableAt && now ? untilText(availableAt, now) : '24時間後'}から</b>つけられます。
              <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                時間をおいて、このページからもう一度どうぞ。
              </div>
            </div>
          ) : state === 'can_rate' ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line-strong)' }}>
              <p className="text-sm" style={{ fontWeight: 700 }}>このお店の一台を評価する</p>
              <div className="mt-2">
                <Stars value={score} onChange={setScore} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                placeholder="一言コメント（任意）：正直な感想をどうぞ"
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
                style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
              />
              <button type="button" onClick={rate} disabled={busy} className="btn btn-ember mt-3 text-sm">
                {pending ? '記録中…' : '評価を送信'}
              </button>
            </div>
          ) : (
            <button type="button" onClick={checkin} disabled={busy} className="btn btn-ember text-sm">
              {locating ? '📡 現在地を確認中…' : pending ? '記録中…' : '📍 お店で来店チェックイン'}
            </button>
          )}
        </div>

        {msg && (
          <p className="mt-2 text-xs" style={{ color: msg.kind === 'ok' ? 'var(--color-ember-hot)' : 'var(--color-ember-deep)' }}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  )
}
