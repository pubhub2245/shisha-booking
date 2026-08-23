'use client'

import { useState, useTransition } from 'react'
import { updateShop } from '@/actions/shop'
import { REGIONS } from '@/lib/regions'
import type { Shop } from '@/lib/types/database'

export function ShopEditForm({ shop }: { shop: Shop }) {
  const [msg, setMsg] = useState<null | 'ok' | string>(null)
  const [pending, startTransition] = useTransition()

  // 位置情報（実地評価の近接判定に使う）
  const [lat, setLat] = useState<number | null>(shop.lat)
  const [lng, setLng] = useState<number | null>(shop.lng)
  const [locating, setLocating] = useState(false)
  const [geoErr, setGeoErr] = useState('')
  const hasLoc = lat != null && lng != null

  function captureLocation() {
    if (!('geolocation' in navigator)) {
      setGeoErr('この端末では位置情報を取得できません。')
      return
    }
    setGeoErr('')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      },
      (err) => {
        setLocating(false)
        setGeoErr(
          err.code === err.PERMISSION_DENIED
            ? '位置情報の利用が許可されていません。ブラウザの設定で許可してください。'
            : '位置情報を取得できませんでした。店内で再度お試しください。'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function clearLocation() {
    setLat(null)
    setLng(null)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (lat != null && lng != null) {
      fd.set('lat', String(lat))
      fd.set('lng', String(lng))
    } else {
      fd.set('clear_location', '1')
    }
    setMsg(null)
    startTransition(async () => {
      const res = await updateShop(shop.id, fd)
      setMsg('error' in res ? res.error ?? '更新に失敗しました。' : 'ok')
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {msg === 'ok' && (
        <div className="rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}>
          保存しました。
        </div>
      )}
      {msg && msg !== 'ok' && (
        <div className="rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--color-ember-deep)', color: 'var(--color-ember-hot)' }}>
          {msg}
        </div>
      )}
      <div className="field">
        <label>店舗名 *</label>
        <input name="name" defaultValue={shop.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label>都道府県（地域別ランキング用）</label>
          <select name="prefecture" defaultValue={shop.prefecture ?? ''}>
            <option value="">未設定</option>
            {REGIONS.map((r) => (
              <optgroup key={r.key} label={r.key}>
                {r.prefs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label>エリア（自由記入）</label>
          <input name="area" defaultValue={shop.area ?? ''} placeholder="渋谷・道玄坂" />
        </div>
      </div>
      <div className="field">
        <label>Web / SNS リンク</label>
        <input name="url" defaultValue={shop.url ?? ''} placeholder="https://..." />
      </div>
      <div className="field">
        <label>お店の紹介</label>
        <textarea name="description" defaultValue={shop.description ?? ''} maxLength={400} />
      </div>

      {/* ---------- 実地評価用の位置情報 ---------- */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <div className="text-sm" style={{ fontWeight: 700 }}>お店の位置（実地評価用）</div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          この位置を基準に「お客さんが本当に来店したか」をGPSで判定します。
          <b>お店の中で</b>「現在地を登録」を押してください。来店したお客さんだけが、あなたの作り方を実地評価できるようになります。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={captureLocation} disabled={locating} className="btn btn-ghost text-sm">
            {locating ? '取得中…' : hasLoc ? '現在地で更新' : '現在地を登録'}
          </button>
          {hasLoc && (
            <button type="button" onClick={clearLocation} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              位置を削除
            </button>
          )}
          <span className="text-xs" style={{ color: hasLoc ? 'var(--color-ember-hot)' : 'var(--color-ash-dim)' }}>
            {hasLoc ? `登録済み（${lat!.toFixed(5)}, ${lng!.toFixed(5)}）` : '未登録'}
          </span>
        </div>
        {geoErr && <p className="mt-2 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{geoErr}</p>}
        <div className="field mt-3 max-w-[220px]">
          <label className="text-xs">来店とみなす半径（m）</label>
          <input
            name="geo_radius_m"
            type="number"
            min={50}
            max={1000}
            step={10}
            defaultValue={shop.geo_radius_m ?? 150}
          />
          <p className="mt-1 text-[0.68rem]" style={{ color: 'var(--color-ash-dim)' }}>
            50〜1000m。ビル内や地下店舗はGPS誤差が出やすいので広め（150〜300m）がおすすめです。
          </p>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-ghost self-start text-sm">
        {pending ? '保存中…' : '店舗情報を保存'}
      </button>
    </form>
  )
}
