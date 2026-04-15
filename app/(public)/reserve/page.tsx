import Link from 'next/link'
import { createReservation } from '@/actions/reservations'
import ReserveFormClient from './form-client'
import SiteHeader from '@/app/_components/site-header'

export const dynamic = 'force-dynamic'

export default function ReservePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <SiteHeader />
      <div className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-amber-400 transition-colors">
              ← トップに戻る
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">出張シーシャ予約</h1>
            <p className="text-gray-300 mt-2">
              フォームに入力して送信してください。折り返しご連絡いたします。
            </p>
          </div>
          <ReserveFormClient createReservation={createReservation} />
        </div>
      </div>
    </div>
  )
}
