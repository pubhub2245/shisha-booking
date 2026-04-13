import { createReservation } from '@/actions/reservations'
import ReserveFormClient from './form-client'

export const dynamic = 'force-dynamic'

export default function ReservePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">出張シーシャ予約</h1>
          <p className="text-gray-700 mt-2">
            フォームに入力して送信してください。折り返しご連絡いたします。
          </p>
        </div>
        <ReserveFormClient createReservation={createReservation} />
      </div>
    </div>
  )
}
