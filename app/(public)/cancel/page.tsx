import Link from 'next/link'
import CancelClient from './cancel-client'
import { findReservationsByPhone, cancelReservationByPhone } from '@/actions/reservations'
import SiteHeader from '@/app/_components/site-header'

export default function CancelPage() {
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">予約キャンセル</h1>
            <p className="text-gray-300 mt-2 text-sm">
              ご予約時に入力した電話番号を入力してください。
            </p>
          </div>
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-medium">
            ※ キャンセルは予約時間の2時間前までとなります。2時間前を過ぎた予約はキャンセルできません。
          </div>
          <CancelClient
            findReservations={findReservationsByPhone}
            cancelReservation={cancelReservationByPhone}
          />
        </div>
      </div>
    </div>
  )
}
