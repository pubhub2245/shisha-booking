'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitOnsiteRating } from '@/actions/onsite'
import type { OnsiteContext } from '@/lib/types/database'

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
  const [rated, setRated] = useState(ctx.myRated)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [locating, setLocating] = useState(false)
  const [pending, start] = useTransition()

  const shopNames = ctx.shops.map((s) => s.name).join('・')

  function evaluate() {
    if (!isAuthed) {
      router.push('/login?next=' + encodeURIComponent(`/mix/${mixId}`))
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
          const res = await submitOnsiteRating(mixId, latitude, longitude)
          switch (res.status) {
            case 'recorded':
              setRated(true)
              setCount(res.count)
              setMsg({ kind: 'ok', text: `${res.shopName} での実地評価を記録しました。ありがとうございます！` })
              router.refresh()
              break
            case 'already':
              setRated(true)
              setCount(res.count)
              setMsg({ kind: 'ok', text: 'すでに実地評価済みです。' })
              break
            case 'too_far':
              setMsg({
                kind: 'err',
                text: `お店から約${res.distance}m 離れています（有効範囲 ${res.radius}m）。店内で実物を吸ってから評価してください。`,
              })
              break
            case 'no_shop':
              setMsg({ kind: 'err', text: '投稿者のお店の位置がまだ登録されていないため、実地評価はできません。' })
              break
            case 'own_mix':
              setMsg({ kind: 'err', text: '自分の投稿は実地評価できません。' })
              break
            case 'not_authed':
              router.push('/login?next=' + encodeURIComponent(`/mix/${mixId}`))
              break
            default:
              setMsg({ kind: 'err', text: '評価の記録に失敗しました。時間をおいて再度お試しください。' })
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

  const busy = locating || pending

  return (
    <section className="mt-8">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'rgb(230 0 51 / 0.30)', background: 'rgb(230 0 51 / 0.05)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base" style={{ fontWeight: 800 }}>
            📍 実地評価
          </h2>
          <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
            {count}人が現地で評価
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          実際に<b>お店で本物を吸った</b>人だけが押せる評価です。現地でのGPSで「その場にいたこと」を確認します。
          いいねより<b>重い一票</b>として、日本代表の選出に効きます。
        </p>

        {ctx.shops.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            評価できるお店：<b style={{ color: 'var(--color-cream)' }}>{shopNames}</b>
          </p>
        )}

        <div className="mt-3">
          {ctx.isOwn ? (
            <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>自分の投稿は実地評価できません。</p>
          ) : ctx.shops.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
              投稿者がまだお店の位置を登録していないため、実地評価はできません。
            </p>
          ) : rated ? (
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
              ✓ 実地評価済み
            </div>
          ) : (
            <button
              type="button"
              onClick={evaluate}
              disabled={busy}
              className="btn btn-ember text-sm"
            >
              {locating ? '📡 現在地を確認中…' : pending ? '記録中…' : '📍 お店で吸った — 実地評価する'}
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
