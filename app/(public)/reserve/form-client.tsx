'use client'

import { useState, useEffect, useRef, useActionState } from 'react'
import type { ReservationFormState } from '@/actions/reservations'
import { jstTodayStr, jstNowMinutes } from '@/lib/utils/datetime'
import { createClient as createSupabaseBrowser } from '@/lib/supabase/client'

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

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function ReserveFormClient({
  createReservation,
}: {
  createReservation: (
    prev: ReservationFormState | null,
    formData: FormData
  ) => Promise<ReservationFormState>
}) {
  const today = jstTodayStr()
  const [state, formAction, isPending] = useActionState<ReservationFormState | null, FormData>(
    createReservation,
    null
  )
  const [areas, setAreas] = useState<Area[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [area, setArea] = useState('')
  const [barQuery, setBarQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [phoneVal, setPhoneVal] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const UNIT_PRICE = 5000
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

  const selectedArea = areas.find(a => a.label === area)
  const isAreaUnavailable = selectedArea?.max_units === 0

  // Fetch availability when area or date changes, and live-update via Supabase Realtime
  useEffect(() => {
    if (!area || !selectedDate || isAreaUnavailable) {
      setBlockedSlots(new Set())
      setBookedSlots(new Set())
      return
    }
    let cancelled = false
    const refetch = () => {
      setLoadingSlots(true)
      fetch(`/api/availability?area=${encodeURIComponent(area)}&date=${selectedDate}`)
        .then(r => r.json())
        .then((data: { blocked: string[]; booked: string[] }) => {
          if (cancelled) return
          setBlockedSlots(new Set(data.blocked))
          setBookedSlots(new Set(data.booked))
        })
        .finally(() => { if (!cancelled) setLoadingSlots(false) })
    }
    refetch()

    // Realtime: 同じエリア・日付の予約変更が来たら再取得
    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`avail:${area}:${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `reservation_date=eq.${selectedDate}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { area?: string } | null
          if (!row || row.area === area) refetch()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [area, selectedDate, isAreaUnavailable])

  // Clear time if it becomes blocked
  useEffect(() => {
    if (selectedTime && (blockedSlots.has(selectedTime) || isSlotPast(selectedTime))) {
      setSelectedTime('')
    }
  }, [blockedSlots, selectedDate])

  // Places (server proxy) + DB suggestions
  type Suggestion =
    | { kind: 'place'; place_id: string; description: string }
    | { kind: 'bar'; bar: Bar }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (!barQuery || barQuery.length < 1) { setSuggestions([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      const [placesRes, barsRes] = await Promise.all([
        fetch(`/api/places/autocomplete?q=${encodeURIComponent(barQuery)}`).then((r) => r.json()).catch(() => ({ predictions: [] })),
        (() => {
          const params = new URLSearchParams({ q: barQuery })
          if (area) params.set('area', area)
          return fetch(`/api/bars?${params}`).then((r) => r.json()).catch(() => [])
        })(),
      ])
      if (cancelled) return
      const merged: Suggestion[] = [
        ...((placesRes.predictions ?? []) as Array<{ place_id: string; description: string }>).map(
          (p) => ({ kind: 'place' as const, place_id: p.place_id, description: p.description })
        ),
        ...((barsRes ?? []) as Bar[]).map((b) => ({ kind: 'bar' as const, bar: b })),
      ]
      setSuggestions(merged)
      setShowSuggestions(true)
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [barQuery, area])

  async function selectPlace(placeId: string, description: string) {
    setBarQuery(description)
    setShowSuggestions(false)
    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`)
      const data = (await res.json()) as { name?: string; address?: string }
      if (data.name) setBarQuery(data.name)
      if (data.address) setAddress(data.address)
    } catch {}
  }

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
    return timeToMinutes(time) <= jstNowMinutes()
  }

  function getSlotStatus(time: string): 'available' | 'past' | 'booked' | 'blocked' {
    if (isSlotPast(time)) return 'past'
    if (bookedSlots.has(time)) return 'booked'
    if (blockedSlots.has(time)) return 'blocked'
    return 'available'
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!name.trim()) e.customer_name = 'お名前を入力してください'
    const normPhone = phoneVal.replace(/[\s\-‐ー－()（）]/g, '')
    if (!normPhone) e.customer_phone = '電話番号を入力してください'
    else if (!/^0\d{9,10}$/.test(normPhone))
      e.customer_phone = '電話番号は 0 から始まる 10〜11 桁で入力してください'
    if (!area) e.area = 'エリアを選択してください'
    if (!selectedDate) e.reservation_date = '日付を選択してください'
    if (!selectedTime) e.reservation_time = '時間を選択してください'
    if (!address.trim()) e.location = '住所・場所を入力してください'
    return e
  }

  // Re-validate on field change after first submit attempt
  useEffect(() => {
    if (!submitAttempted) return
    setErrors(validate())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phoneVal, area, selectedDate, selectedTime, address, submitAttempted])

  // サーバーから返ってきた fieldErrors をマージ
  useEffect(() => {
    if (state && !state.ok && state.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...state.fieldErrors }))
      setSubmitAttempted(true)
      const top = document.getElementById('reserve-form-top')
      if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [state])

  function handleClientValidate(e: React.FormEvent<HTMLFormElement>) {
    setSubmitAttempted(true)
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0 || isAreaUnavailable) {
      e.preventDefault()
      const top = document.getElementById('reserve-form-top')
      if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
    <form action={formAction} onSubmit={handleClientValidate} noValidate className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
      <div id="reserve-form-top" />
      {state && !state.ok && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
          {state.error}
        </div>
      )}
      {(!state || state.ok !== false) && submitAttempted && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
          入力内容をご確認ください
        </div>
      )}

      {/* お名前 */}
      <Field label="お名前" required error={errors.customer_name}>
        <input
          type="text"
          name="customer_name"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls(!!errors.customer_name)}
        />
      </Field>

      {/* ふりがな */}
      <Field label="ふりがな（任意）">
        <input
          type="text"
          name="customer_name_kana"
          value={nameKana}
          onChange={e => setNameKana(e.target.value)}
          placeholder="やまだ たろう"
          className={inputClass}
        />
      </Field>

      {/* 電話番号 */}
      <Field label="電話番号" required error={errors.customer_phone}>
        <input
          type="tel"
          name="customer_phone"
          value={phoneVal}
          onChange={e => setPhoneVal(e.target.value)}
          placeholder="090-1234-5678"
          inputMode="tel"
          autoComplete="tel"
          className={inputCls(!!errors.customer_phone)}
        />
        <p className="mt-1 text-xs text-red-400">
          ※ キャンセル時に電話番号が必要です。お間違いのないようご注意ください。
        </p>
      </Field>

      {/* エリア選択（日付・時間の前に配置して、空き状況を先に取得可能に） */}
      <Field label="エリア" required error={errors.area}>
        <input type="hidden" name="area" value={area} />
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${errors.area ? 'ring-2 ring-red-400 rounded-lg p-1' : ''}`}>
          {areas.map(a => {
            const unavailable = a.max_units === 0
            return (
              <button
                key={a.id}
                type="button"
                disabled={unavailable}
                aria-disabled={unavailable}
                onClick={() => { if (unavailable) return; setArea(a.label); setSelectedTime('') }}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  unavailable
                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none'
                    : area === a.label
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-900 border-gray-300 hover:border-amber-400'
                }`}
              >
                {a.label}
                {unavailable && <span className="block text-base font-bold mt-0.5 text-red-500">準備中</span>}
                {!unavailable && <span className="block text-xs mt-0.5 opacity-70">{a.max_units}台</span>}
              </button>
            )
          })}
        </div>
        {isAreaUnavailable && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            現在このエリアは準備中です。他のエリアをお選びください。
          </div>
        )}
      </Field>

      {/* 予約日（カスタムカレンダー） */}
      <Field label="予約日" required error={errors.reservation_date}>
        <input type="hidden" name="reservation_date" value={selectedDate} />
        <div role="application" aria-label="予約日カレンダー" className={`border rounded-lg p-3 ${errors.reservation_date ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} aria-label="前の月" className="px-2 py-1 text-gray-600 hover:text-gray-900 font-bold">&lsaquo;</button>
            <span className="text-sm font-bold text-gray-900" aria-live="polite">{monthLabel}</span>
            <button type="button" onClick={nextMonth} aria-label="次の月" className="px-2 py-1 text-gray-600 hover:text-gray-900 font-bold">&rsaquo;</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-1" aria-hidden="true">
            {['日','月','火','水','木','金','土'].map(d => (
              <div key={d} className="py-1 font-semibold text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-sm" role="grid">
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} role="gridcell" />
              const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isPast = dateStr < today
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              return (
                <button
                  key={dateStr}
                  type="button"
                  role="gridcell"
                  disabled={isPast}
                  aria-label={`${calMonth.year}年${calMonth.month + 1}月${day}日${isToday ? '（今日）' : ''}`}
                  aria-pressed={isSelected}
                  aria-disabled={isPast}
                  onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                  className={`py-1.5 rounded-md transition-colors ${
                    isPast
                      ? 'text-gray-400 opacity-30 cursor-not-allowed pointer-events-none'
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
      <Field label="予約時間" required error={errors.reservation_time}>
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
                        aria-label={`${t}${status === 'booked' ? ' 予約済み' : status === 'blocked' ? ' 予約不可' : status === 'past' ? ' 過去の時間' : ''}`}
                        aria-pressed={selected}
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
            onChange={e => { setBarQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            placeholder="バー名を入力して検索"
            aria-autocomplete="list"
            className={inputClass}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul role="listbox" className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((s, i) =>
                s.kind === 'bar' ? (
                  <li key={`bar-${s.bar.id}`} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => selectBar(s.bar)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-900 text-sm border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium">{s.bar.name}</span>
                      <span className="text-gray-600 ml-2 text-xs">{s.bar.address}</span>
                    </button>
                  </li>
                ) : (
                  <li key={`place-${s.place_id}-${i}`} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => selectPlace(s.place_id, s.description)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-900 text-sm border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-500 mr-1 text-xs">[Places]</span>
                      <span>{s.description}</span>
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </Field>

      {/* 住所 */}
      <Field label="住所・場所" required error={errors.location}>
        <input
          type="text"
          name="location"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="住所または施設名"
          className={inputCls(!!errors.location)}
        />
      </Field>

      {/* 台数 */}
      <Field label="台数">
        <select
          name="quantity"
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className={inputClass}
        >
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n}>{n}台（{(n * UNIT_PRICE).toLocaleString()}円）</option>
          ))}
        </select>
        <p className="text-sm text-gray-700 mt-2">
          合計金額の目安：<span className="font-bold text-amber-600 text-base">{(quantity * UNIT_PRICE).toLocaleString()}円</span>
        </p>
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

      <div className="pt-4">
        <button
          type="submit"
          disabled={isAreaUnavailable || isPending}
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg py-5 rounded-xl shadow-lg shadow-amber-500/30 transition-colors"
        >
          {isPending ? '送信中...' : '予約を申し込む'}
        </button>
      </div>
    </form>
  )
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500'
const inputClassError = 'w-full border border-red-400 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'

function inputCls(hasError: boolean) {
  return hasError ? inputClassError : inputClass
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-1">
        {label}{required && ' *'}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
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

