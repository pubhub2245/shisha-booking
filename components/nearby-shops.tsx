'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/avatar'
import { flavorLine } from '@/lib/mix'
import { distanceMeters, formatDistance } from '@/lib/score'
import type { ShopRankItem } from '@/lib/types/database'

type Ranked = ShopRankItem & { distance: number }

export function NearbyShops({ shops }: { shops: ShopRankItem[] }) {
  const [list, setList] = useState<Ranked[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function findNearby() {
    if (!('geolocation' in navigator)) {
      setErr('この端末では位置情報を取得できません。')
      return
    }
    setErr('')
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const ranked = shops
          .filter((s) => s.shop.lat != null && s.shop.lng != null)
          .map((s) => ({ ...s, distance: distanceMeters(latitude, longitude, s.shop.lat!, s.shop.lng!) }))
          // 近さ優先。同程度の距離帯（500m刻み）ならスコアの高い順。
          .sort((a, b) => {
            const band = Math.floor(a.distance / 500) - Math.floor(b.distance / 500)
            return band !== 0 ? band : b.score - a.score
          })
          .slice(0, 8)
        setList(ranked)
        setBusy(false)
      },
      (e) => {
        setBusy(false)
        setErr(
          e.code === e.PERMISSION_DENIED
            ? '位置情報の利用が許可されていません。ブラウザの設定で許可してください。'
            : '位置情報を取得できませんでした。電波の良い場所で再度お試しください。'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  if (shops.length === 0) return null

  return (
    <section className="mt-6">
      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--line-strong)', background: 'var(--color-smoke-850)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base" style={{ fontWeight: 800 }}>
              現在地から近い高評価店
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ash)' }}>
              いる場所の周りで、評価の高いシーシャ屋を近い順に。旅行・出張先で使えます。
            </p>
          </div>
          <button type="button" onClick={findNearby} disabled={busy} className="btn btn-ember shrink-0 text-sm">
            {busy ? '探しています…' : '現在地から探す'}
          </button>
        </div>

        {err && <p className="mt-2 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{err}</p>}

        {list && (
          list.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-ash-dim)' }}>近くに登録店が見つかりませんでした。</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {list.map((it) => (
                <Link key={it.shop.id} href={`/shop/${it.shop.id}`} className="card card-hover flex items-center gap-3 p-3">
                  <span className="shrink-0 rounded-full px-2 py-1 text-xs" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 800 }}>
                    {formatDistance(it.distance)}
                  </span>
                  <Avatar name={it.shop.name} seed={it.shop.id} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm" style={{ fontWeight: 700 }}>{it.shop.name}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                      <span>{[it.shop.prefecture, it.shop.area].filter(Boolean).join('・')}</span>
                      {it.onsite > 0 && <span style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>実地 {it.onsite}</span>}
                      {it.topMix && <span className="truncate">代表作：{flavorLine(it.topMix.mix_flavors)}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--color-ash)', fontWeight: 700 }}>{it.score}pt</span>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}
