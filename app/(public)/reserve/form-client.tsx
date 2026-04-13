'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Flavor = { id: string; name: string; stock: number }
type Bar = { id: string; name: string; address: string; area: string }

const AREAS = [
  '宮崎市内（西橘周辺）',
  '都城市内（牟田町周辺）',
  '鹿児島市内（天文館周辺）',
] as const

const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isSameDay(a: string, b: string) {
  return a === b
}

export default function ReserveFormClient({
  flavors,
  createReservation,
}: {
  flavors: Flavor[]
  createReservation: (formData: FormData) => Promise<void>
}) {
  const today = toDateStr(new Date())
  const [area, setArea] = useState('')
  const [barQuery, setBarQuery] = useState('')
  const [bars, setBars] = useState<Bar[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const suggestRef = useRef<HTMLDivElement>(null)
  const placesInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Google Places Autocomplete
  const hasPlacesKey = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  useEffect(() => {
    if (!hasPlacesKey) return
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) return
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=ja`
    script.async = true
    script.onload = () => initAutocomplete()
    document.head.appendChild(script)
  }, [hasPlacesKey])

  const initAutocomplete = useCallback(() => {
    if (!placesInputRef.current || !window.google?.maps?.places) return
    const ac = new window.google.maps.places.Autocomplete(placesInputRef.current, {
      types: ['establishment'],
      componentRestrictions: { country: 'jp' },
      fields: ['name', 'formatted_address'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place.name) setBarQuery(place.name)
      if (place.formatted_address) setAddress(place.formatted_address)
    })
    autocompleteRef.current = ac
  }, [])

  // DB bar suggestions (fallback when no Places API)
  useEffect(() => {
    if (hasPlacesKey) return // use Google Places instead
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
  }, [barQuery, area, hasPlacesKey])

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

  // Time slot disabled logic
  const nowHour = new Date().getHours()
  function isTimeDisabled(time: string) {
    if (!selectedDate || !isSameDay(selectedDate, today)) return false
    const hour = parseInt(time.split(':')[0], 10)
    return hour <= nowHour
  }

  // Calendar
  const calDays = buildCalendar(calMonth.year, calMonth.month)

  function prevMonth() {
    setCalMonth(prev => {
      const d = new Date(prev.year, prev.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }
  function nextMonth() {
    setCalMonth(prev => {
      const d = new Date(prev.year, prev.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const monthLabel = `${calMonth.year}年${calMonth.month + 1}月`

  return (
    <form action={createReservation} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
      {/* お名前 */}
      <Field label="お名前" required>
        <input type="text" name="customer_name" required className={inputClass} />
      </Field>

      {/* 電話番号 */}
      <Field label="電話番号" required>
        <input type="tel" name="customer_phone" required placeholder="090-1234-5678" className={inputClass} />
      </Field>

      {/* 予約日（カスタムカレンダー） */}
      <Field label="予約日" required>
        <input type="hidden" name="reservation_date" value={selectedDate} />
        <div className="border border-gray-300 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="px-2 py-1 text-gray-600 hover:text-gray-900 font-bold">&lsaquo;</button>
            <span className="text-sm font-bold text-gray-900">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 text-gray-600 hover:text-gray-900 font-bold">&rsaquo;</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-1">
            {['日','月','火','水','木','金','土'].map(d => (
              <div key={d} className="py-1 font-semibold text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isPast = dateStr < today
              const isToday = isSameDay(dateStr, today)
              const isSelected = isSameDay(dateStr, selectedDate)
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    setSelectedDate(dateStr)
                    // 日付変更時に無効な時間をクリア
                    if (isSameDay(dateStr, today) && selectedTime && isTimeDisabled(selectedTime)) {
                      setSelectedTime('')
                    }
                  }}
                  className={`py-1.5 rounded-md transition-colors ${
                    isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-amber-500 text-white font-bold'
                        : isToday
                          ? 'border border-gray-400 text-gray-900 font-medium hover:bg-gray-100'
                          : 'text-gray-900 hover:bg-amber-50'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
        {selectedDate && (
          <p className="text-sm text-amber-600 font-medium mt-1">
            選択中: {selectedDate.replace(/-/g, '/')}
          </p>
        )}
      </Field>

      {/* 予約時間（2時間ごと） */}
      <Field label="予約時間" required>
        <input type="hidden" name="reservation_time" value={selectedTime} />
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {TIME_SLOTS.map(t => {
            const disabled = isTimeDisabled(t)
            const selected = selectedTime === t
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedTime(selected ? '' : t)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : selected
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-900 border-gray-300 hover:border-amber-400'
                }`}
              >
                {t}〜
              </button>
            )
          })}
        </div>
      </Field>

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

      {/* バー名 */}
      <Field label="バー名（任意）">
        <div className="relative" ref={suggestRef}>
          <input
            ref={placesInputRef}
            type="text"
            value={barQuery}
            onChange={e => { setBarQuery(e.target.value); if (!hasPlacesKey) setShowSuggestions(true) }}
            onFocus={() => { if (!hasPlacesKey && bars.length > 0) setShowSuggestions(true); if (hasPlacesKey && !autocompleteRef.current) initAutocomplete() }}
            placeholder="バー名を入力して検索"
            className={inputClass}
          />
          {/* DB fallback suggestions (only when no Google Places API) */}
          {!hasPlacesKey && showSuggestions && bars.length > 0 && (
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
          className={inputClass}
        />
      </Field>

      {/* 人数 */}
      <Field label="人数">
        <select name="quantity" defaultValue="1" className={inputClass}>
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
        <textarea name="notes" rows={3} placeholder="ご要望があればご記入ください" className={inputClass} />
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

const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500'

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

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

// Google Maps types
declare global {
  interface Window {
    google: typeof google
  }
}
