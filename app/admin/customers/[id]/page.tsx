import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '../../_components/admin-shell'
import { getCustomerById, getReservationsByCustomer } from '@/actions/reservations'
import { getStatusClasses, getStatusLabel } from '@/lib/utils/status'

export const dynamic = 'force-dynamic'

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const reservations = await getReservationsByCustomer(id)

  const c = customer as {
    id: string; name: string; phone: string | null; contact_sns: string | null
    first_used_at: string | null; area: string | null; created_at: string
  }

  type R = {
    id: string; reservation_date: string; reservation_time: string
    area: string; quantity: number; status: string
  }

  return (
    <AdminShell active="customers" userEmail={user.email}>
      <div className="mb-4">
        <Link href="/admin/customers" className="text-sm text-gray-500 hover:text-gray-900">&larr; 顧客一覧</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.name}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500 font-medium">電話番号</dt><dd className="text-gray-900">{c.phone || '-'}</dd></div>
          <div><dt className="text-gray-500 font-medium">Instagram</dt><dd className="text-gray-900">{c.contact_sns || '-'}</dd></div>
          <div><dt className="text-gray-500 font-medium">エリア</dt><dd className="text-gray-900">{c.area || '-'}</dd></div>
          <div><dt className="text-gray-500 font-medium">初回利用日</dt><dd className="text-gray-900">{c.first_used_at || c.created_at?.slice(0, 10)}</dd></div>
        </dl>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">予約履歴 ({reservations.length})</h3>
        </div>
        {reservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">予約履歴はありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">日時</th>
                <th className="px-4 py-3 text-left">エリア</th>
                <th className="px-4 py-3 text-left">台数</th>
                <th className="px-4 py-3 text-left">ステータス</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(reservations as R[]).map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{r.reservation_date} {r.reservation_time}</td>
                  <td className="px-4 py-3 text-gray-900">{r.area}</td>
                  <td className="px-4 py-3 text-gray-900">{r.quantity}台</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(r.status)}`}>
                      {getStatusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/reservations/${r.id}`} className="text-amber-600 hover:text-amber-700 font-medium">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  )
}
