'use client'

import { useState, useTransition } from 'react'

type Reservation = {
  id: string
  reservation_date: string
  reservation_time: string
  area: string
  location: string
  quantity: number
  status: string
  customer_name?: string
}

type Props = {
  findReservations: (phone: string) => Promise<Reservation[]>
  cancelReservation: (id: string, phone: string) => Promise<{ ok: boolean; error?: string }>
}

export default function CancelClient({ findReservations, cancelReservation }: Props) {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [reservations, setReservations] = useState<Reservation[] | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) return
    setMessage(null)
    startTransition(async () => {
      const data = await findReservations(trimmed)
      setReservations(data)
      setSearchedPhone(trimmed)
    })
  }

  function handleCancel(id: string) {
    if (!confirm('本当にこの予約をキャンセルしますか？')) return
    startTransition(async () => {
      const res = await cancelReservation(id, searchedPhone)
      if (res.ok) {
        setMessage({ type: 'success', text: 'キャンセルが完了しました' })
        const data = await findReservations(searchedPhone)
        setReservations(data)
      } else {
        setMessage({ type: 'error', text: res.error || 'キャンセルに失敗しました' })
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow p-6 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">電話番号</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09012345678"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {isPending ? '検索中…' : '予約を検索'}
        </button>
      </form>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {reservations !== null && (
        <div className="space-y-3">
          {reservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600 text-sm">
              該当する予約は見つかりませんでした。
            </div>
          ) : (
            reservations.map((r) => {
              const reservationAt = new Date(`${r.reservation_date}T${r.reservation_time}`)
              const diffMs = reservationAt.getTime() - Date.now()
              const expired = diffMs < 2 * 60 * 60 * 1000
              const alreadyCancelled = r.status === 'cancelled'
              return (
                <div key={r.id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex flex-col gap-1 text-sm text-gray-800">
                    <div className="font-bold text-base">
                      {r.reservation_date} {r.reservation_time}
                    </div>
                    <div>エリア: {r.area}</div>
                    <div>場所: {r.location}</div>
                    <div>台数: {r.quantity}</div>
                  </div>
                  <div className="mt-4">
                    {alreadyCancelled ? (
                      <div className="text-sm text-gray-500">キャンセル済み</div>
                    ) : expired ? (
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed"
                      >
                        キャンセル期限を過ぎています
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={isPending}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
                      >
                        キャンセルする
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
