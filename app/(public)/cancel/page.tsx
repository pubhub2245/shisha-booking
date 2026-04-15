import Link from 'next/link'
import CancelClient from './cancel-client'
import { findReservationsByPhone, cancelReservationByPhone } from '@/actions/reservations'

export const dynamic = 'force-dynamic'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ← トップに戻る
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">予約キャンセル</h1>
          <p className="text-gray-700 mt-2 text-sm">
            ご予約時に入力した電話番号を入力してください。
          </p>
        </div>
        <CancelClient
          findReservations={findReservationsByPhone}
          cancelReservation={cancelReservationByPhone}
        />
      </div>
    </div>
  )
}
