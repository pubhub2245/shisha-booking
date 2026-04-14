'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Flavor = { id: string; name: string; stock: number }
type Area = { id: string; label: string; max_units: number }
type Bar = { id: string; name: string; address: string; area: string }

// 10:00 ~ 22:00 を10分刻みで生成
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 10; h <= 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 22 && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const ALL_TIME_SLOTS = generateTimeSlots()

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function ReserveFormClient({
  createReservation,
}: {
  createReservation: (formData: FormData) => Promise<void>
}) {
  const today = toDateStr(new Date())
  const [areas, setAreas] = useState<Area[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [area, setArea] = useState('')
  const [barQuery, setBarQuery] = useState('')
  const [bars, setBars] = useState<Bar[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set())
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)
  const placesInputRef = useRef<HTMLInputElement>(null)

  // Fetch areas and flavors on mount (client-side)
  useEffect(() => {
    Promise.all([
      fetch('/api/areas').then(r => r.json()).catch(() => []),
      fetch('/api/flavors').then(r => r.json()).catch(() => []),
    ]).then(([a, f]) => {
      setAreas(a)
      setFlavors(f)
      setDataLoaded(true)
    })
  }, [])
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const selectedArea = areas.find(a => a.label === area)
  const isAreaUnavailable = selectedArea?.max_units === 0

  // Fetch availability when area or date changes
  useEffect(() => {
    if (!area || !selectedDate || isAreaUnavailable) {
      setBlockedSlots(new Set())
      setBookedSlots(new Set())
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    fetch(`/api/availability?area=${encodeURIComponent(area)}&date=${selectedDate}`)
      .then(r => r.json())
      .then((data: { blocked: string[]; booked: string[] }) => {
        if (cancelled) return
        setBlockedSlots(new Set(data.blocked))
        setBookedSlots(new Set(data.booked))
      })
      .finally(() => { if (!cancelled) setLoadingSlots(false) })
    return () => { cancelled = true }
  }, [area, selectedDate, isAreaUnavailable])

  // Clear time if it becomes blocked
  useEffect(() => {
    if (selectedTime && (blockedSlots.has(selectedTime) || isSlotPast(selectedTime))) {
      setSelectedTime('')
    }
  }, [blockedSlots, selectedDate])

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

  // DB bar suggestions (fallback)
  useEffect(() => {
    if (hasPlacesKey) return
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

  function isSlotPast(time: string) {
    if (!selectedDate || selectedDate !== today) return false
    return timeToMinutes(time) <= nowMinutes()
  }

  function getSlotStatus(time: string): 'available' | 'past' | 'booked' | 'blocked' {
    if (isSlotPast(time)) return 'past'
    if (bookedSlots.has(time)) return 'booked'
    if (blockedSlots.has(time)) return 'blocked'
    return 'available'
  }

  // Calendar
  const calDays = buildCalendar(calMonth.year, calMonth.month)
  function prevMonth() {
    setCalMonth(prev => { const d = new Date(prev.year, prev.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function nextMonth() {
    setCalMonth(prev => { const d = new Date(prev.year, prev.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  const monthLabel = `${calMonth.year}年${calMonth.month + 1}月`

  // Group time slots by hour for display
  const hourGroups: { hour: number; slots: string[] }[] = []
  let currentHour = -1
  for (const slot of ALL_TIME_SLOTS) {
    const h = parseInt(slot.split(':')[0], 10)
    if (h !== currentHour) {
      hourGroups.push({ hour: h, slots: [] })
      currentHour = h
    }
    hourGroups[hourGroups.length - 1].slots.push(slot)
  }

  if (!dataLoaded) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
        読み込み中...
      </div>
    )
  }

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

      {/* エリア選択（日付・時間の前に配置して、空き状況を先に取得可能に） */}
      <Field label="エリア" required>
        <input type="hidden" name="area" value={area} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {areas.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setArea(a.label); setSelectedTime('') }}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                area === a.label
                  ? a.max_units === 0
                    ? 'bg-gray-400 text-white border-gray-400'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-900 border-gray-300 hover:border-amber-400'
              }`}
            >
              {a.label}
              {a.max_units === 0 && <span className="block text-xs mt-0.5 opacity-80">準備中</span>}
              {a.max_units > 0 && <span className="block text-xs mt-0.5 opacity-70">{a.max_units}台</span>}
            </button>
          ))}
        </div>
        {isAreaUnavailable && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            現在このエリアは準備中です。他のエリアをお選びください。
          </div>
        )}
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
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
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

      {/* 予約時間（10分刻み） */}
      <Field label="予約時間" required>
        <input type="hidden" name="reservation_time" value={selectedTime} />
        {!selectedDate || !area ? (
          <p className="text-sm text-gray-500">エリアと日付を先に選択してください</p>
        ) : isAreaUnavailable ? (
          <p className="text-sm text-yellow-700">このエリアは現在準備中です</p>
        ) : loadingSlots ? (
          <p className="text-sm text-gray-500">空き状況を確認中...</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {hourGroups.map(({ hour, slots }) => (
              <div key={hour}>
                <div className="text-xs font-semibold text-gray-500 mb-1">{hour}:00</div>
                <div className="grid grid-cols-6 gap-1">
                  {slots.map(t => {
                    const status = getSlotStatus(t)
                    const selected = selectedTime === t
                    const disabled = status !== 'available'
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedTime(selected ? '' : t)}
                        title={status === 'booked' ? '予約済み' : status === 'blocked' ? '予約不可' : status === 'past' ? '過去の時間' : ''}
                        className={`py-1.5 rounded text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-amber-500 text-white'
                            : status === 'booked'
                              ? 'bg-red-100 text-red-400 cursor-not-allowed'
                              : disabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-900 border border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        {t.substring(3)}
                        {status === 'booked' && <span className="block text-[10px] leading-none">済</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedTime && (
          <p className="text-sm text-amber-600 font-medium mt-1">選択中: {selectedTime}〜</p>
        )}
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

      {/* 台数 */}
      <Field label="台数">
        <select name="quantity" defaultValue="1" className={inputClass}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n}>{n}台</option>
          ))}
        </select>
      </Field>

      {/* Instagram */}
      <Field label="Instagram（任意）">
        <input type="text" name="instagram" placeholder="@your_account" className={inputClass} />
      </Field>

      {/* 支払い方法 */}
      <Field label="支払い方法" required>
        <select name="payment_method" defaultValue="現金" required className={inputClass}>
          <option value="現金">現金</option>
          <option value="その他">その他（備考に記入）</option>
        </select>
      </Field>

      {/* フレーバー選択 */}
      <Field label="フレーバー（任意）">
        <input type="hidden" name="flavor_id" value={selectedFlavorId} />
        {flavors.length === 0 ? (
          <p className="text-gray-600 text-sm">フレーバーは当日ご相談ください</p>
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
        disabled={isAreaUnavailable || !selectedDate || !selectedTime || !area}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
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

declare global {
  interface Window { google: typeof google }
}
