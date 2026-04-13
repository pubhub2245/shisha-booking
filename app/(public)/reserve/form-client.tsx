'use client'

import { useState, useEffect, useRef } from 'react'

type Flavor = { id: string; name: string; stock: number }
type Bar = { id: string; name: string; address: string; area: string }

const AREAS = [
  '宮崎市内（西橘周辺）',
  '都城市内（牟田町周辺）',
  '鹿児島市内（天文館周辺）',
] as const

export default function ReserveFormClient({
  flavors,
  createReservation,
}: {
  flavors: Flavor[]
  createReservation: (formData: FormData) => Promise<void>
}) {
  const [area, setArea] = useState('')
  const [barQuery, setBarQuery] = useState('')
  const [bars, setBars] = useState<Bar[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const suggestRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barQuery || barQuery.length < 1) { setBars([]); return }
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: barQuery })
      if (area) params.set('area', area)
      const res = await fetch(`/api/bars?${params}`)
      const data = await res.json()
      setBars(data)
      setShowSuggestions(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [barQuery, area])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectBar(bar: Bar) {
    setBarQuery(bar.name)
    setAddress(bar.address)
    if (bar.area) setArea(bar.area)
    setShowSuggestions(false)
  }

  return (
    <form action={createReservation} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
      {/* お名前 */}
      <Field label="お名前" required>
        <input
          type="text"
          name="customer_name"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      {/* 電話番号 */}
      <Field label="電話番号" required>
        <input
          type="tel"
          name="customer_phone"
          required
          placeholder="090-1234-5678"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      {/* 予約日・時間 */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="予約日" required>
          <input
            type="date"
            name="reservation_date"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </Field>
        <Field label="予約時間" required>
          <select
            name="reservation_time"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">選択</option>
            {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
              <option key={t} value={t}>{t}〜</option>
            ))}
          </select>
        </Field>
      </div>

      {/* エリア選択 */}
      <Field label="エリア" required>
        <input type="hidden" name="area" value={area} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {AREAS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                area === a
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-900 border-gray-300 hover:border-amber-400'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      {/* バー名（サジェスト付き） */}
      <Field label="バー名（任意）">
        <div className="relative" ref={suggestRef}>
          <input
            type="text"
            value={barQuery}
            onChange={e => { setBarQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => bars.length > 0 && setShowSuggestions(true)}
            placeholder="バー名を入力して検索"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {showSuggestions && bars.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {bars.map(bar => (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => selectBar(bar)}
                  className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-900 text-sm border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{bar.name}</span>
                  <span className="text-gray-600 ml-2 text-xs">{bar.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      {/* 住所 */}
      <Field label="住所・場所" required>
        <input
          type="text"
          name="location"
          required
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="住所または施設名"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      {/* 人数 */}
      <Field label="人数">
        <select
          name="quantity"
          defaultValue="1"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n}>{n}台</option>
          ))}
        </select>
      </Field>

      {/* フレーバー選択 */}
      <Field label="フレーバー（任意）">
        <input type="hidden" name="flavor_id" value={selectedFlavorId} />
        {flavors.length === 0 ? (
          <p className="text-gray-600 text-sm">現在選択可能なフレーバーはありません</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {flavors.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFlavorId(selectedFlavorId === f.id ? '' : f.id)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedFlavorId === f.id
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-900 border-gray-300 hover:border-amber-400'
                }`}
              >
                {f.name}
                <span className={`ml-1 text-xs ${selectedFlavorId === f.id ? 'text-amber-100' : 'text-gray-500'}`}>
                  (残{f.stock})
                </span>
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* 備考 */}
      <Field label="備考（任意）">
        <textarea
          name="notes"
          rows={3}
          placeholder="ご要望があればご記入ください"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </Field>

      <button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
      >
        予約を申し込む
      </button>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}
