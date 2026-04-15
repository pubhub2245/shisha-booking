import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '../_components/admin-shell'
import { getCustomers } from '@/actions/reservations'
import Pagination from '../_components/pagination'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const page = Math.max(1, Number(sp.page) || 1)
  const { rows: customers, total, pageSize } = await getCustomers(sp.q, { page })

  type Row = {
    id: string
    name: string
    phone: string | null
    contact_sns: string | null
    first_used_at: string | null
    created_at: string
    reservation_count: number
  }

  return (
    <AdminShell active="customers" userEmail={user.email}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">顧客一覧</h2>
      </div>

      <form method="get" className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={sp.q || ''}
          placeholder="名前で検索"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2 rounded-lg">
          検索
        </button>
        {sp.q && (
          <Link href="/admin/customers" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">
            クリア
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">登録顧客 ({total})</h3>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">顧客が見つかりません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">名前</th>
                  <th className="px-4 py-3 text-left">電話番号</th>
                  <th className="px-4 py-3 text-left">Instagram</th>
                  <th className="px-4 py-3 text-left">初回利用日</th>
                  <th className="px-4 py-3 text-left">予約回数</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(customers as Row[]).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-900">{c.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{c.contact_sns || '-'}</td>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {c.first_used_at || c.created_at?.slice(0, 10) || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{c.reservation_count}回</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/customers/${c.id}`} className="text-amber-600 hover:text-amber-700 font-medium">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          baseHref={`/admin/customers${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ''}`}
        />
      </div>
    </AdminShell>
  )
}
