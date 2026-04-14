import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import AdminShell from './_components/admin-shell'
import { getFilteredReservations, getAreas } from '@/actions/reservations'
import { STATUS_OPTIONS, getStatusClasses, getStatusLabel } from '@/lib/utils/status'

export const dynamic = 'force-dynamic'

type SP = Promise<{ range?: string; from?: string; to?: string; area?: string; status?: string }>

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resolveRange(range: string | undefined): { from?: string; to?: string } {
  const today = new Date()
  if (range === 'today') {
    const d = toDateStr(today)
    return { from: d, to: d }
  }
  if (range === 'tomorrow') {
    const t = new Date(today); t.setDate(t.getDate() + 1)
    const d = toDateStr(t)
    return { from: d, to: d }
  }
  if (range === 'week') {
    const end = new Date(today); end.setDate(end.getDate() + 6)
    return { from: toDateStr(today), to: toDateStr(end) }
  }
  return {}
}

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") redirect("/staff")

  const areas = await getAreas()

  const range = sp.range
  const customFrom = sp.from
  const customTo = sp.to
  const area = sp.area
  const status = sp.status

  const rangeDates = resolveRange(range)
  const filters = {
    from: customFrom || rangeDates.from,
    to: customTo || rangeDates.to,
    area: area || undefined,
    status: status || undefined,
  }

  const reservations = await getFilteredReservations(filters)

  type Row = {
    id: string
    reservation_date: string
    reservation_time: string
    customer: { name: string; phone: string | null } | null
    area: string
    status: string
    quantity: number
  }

  return (
    <AdminShell active="reservations" userEmail={user.email}>
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="総予約数" value={reservations.length} color="text-gray-900" />
        <Stat label="受付" value={(reservations as Row[]).filter(r => r.status === 'received').length} color="text-blue-500" />
        <Stat label="確認中" value={(reservations as Row[]).filter(r => r.status === 'checking').length} color="text-yellow-500" />
        <Stat label="確定" value={(reservations as Row[]).filter(r => r.status === 'confirmed').length} color="text-green-500" />
      </div>

      <form method="get" className="bg-white rounded-xl shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">期間</label>
          <select name="range" defaultValue={range || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
            <option value="">すべて</option>
            <option value="today">今日</option>
            <option value="tomorrow">明日</option>
            <option value="week">今週(7日)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
          <input type="date" name="from" defaultValue={customFrom || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
          <input type="date" name="to" defaultValue={customTo || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">エリア</label>
          <select name="area" defaultValue={area || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
            <option value="">すべて</option>
            {areas.map((a: { id: string; label: string }) => (
              <option key={a.id} value={a.label}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ステータス</label>
          <select name="status" defaultValue={status || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
            <option value="">すべて</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-5 flex gap-2 justify-end">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">リセット</Link>
          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2 rounded-lg">絞り込む</button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">予約一覧 ({reservations.length})</h2>
        </div>
        {reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">予約はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">日時</th>
                  <th className="px-4 py-3 text-left">お客様</th>
                  <th className="px-4 py-3 text-left">エリア</th>
                  <th className="px-4 py-3 text-left">台数</th>
                  <th className="px-4 py-3 text-left">ステータス</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(reservations as Row[]).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{r.reservation_date} {r.reservation_time}</td>
                    <td className="px-4 py-3 text-gray-900">{r.customer?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{r.area}</td>
                    <td className="px-4 py-3 text-gray-900">{r.quantity}台</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/reservations/${r.id}`} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
