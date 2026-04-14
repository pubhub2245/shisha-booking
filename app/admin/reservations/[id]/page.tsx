import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '../../_components/admin-shell'
import {
  getReservationById,
  getActiveStaffs,
  updateReservationStatus,
  assignStaff,
  updateAdminNote,
} from '@/actions/reservations'
import { STATUS_OPTIONS, getStatusClasses, getStatusLabel } from '@/lib/utils/status'

export const dynamic = 'force-dynamic'

export default async function ReservationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const reservation = await getReservationById(id)
  if (!reservation) notFound()

  const staffs = await getActiveStaffs()
  const r = reservation as {
    id: string
    reservation_date: string
    reservation_time: string
    area: string
    location: string
    quantity: number
    status: string
    admin_note: string | null
    payment_method: string | null
    assigned_staff_id: string | null
    customer: { id: string; name: string; phone: string | null; contact_sns: string | null } | null
    flavor: { id: string; name: string } | null
    assigned_staff: { id: string; name: string } | null
    created_at: string
  }

  return (
    <AdminShell active="reservations" userEmail={user.email}>
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">&larr; 予約一覧</Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">予約詳細</h2>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(r.status)}`}>
          {getStatusLabel(r.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 予約情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">予約情報</h3>
          <dl className="space-y-3 text-sm">
            <Row label="日時" value={`${r.reservation_date} ${r.reservation_time}`} />
            <Row label="エリア" value={r.area} />
            <Row label="場所" value={r.location} />
            <Row label="台数" value={`${r.quantity}台`} />
            <Row label="フレーバー" value={r.flavor?.name || '未指定'} />
            <Row label="支払い方法" value={r.payment_method || '-'} />
            <Row label="受付日時" value={new Date(r.created_at).toLocaleString('ja-JP')} />
            <div>
              <dt className="text-gray-500 font-medium">備考</dt>
              <dd className="text-gray-900 whitespace-pre-wrap mt-1">{r.admin_note || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* 顧客情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">顧客情報</h3>
          {r.customer ? (
            <dl className="space-y-3 text-sm">
              <Row label="名前" value={r.customer.name} />
              <Row label="電話番号" value={r.customer.phone || '-'} />
              <Row label="Instagram" value={r.customer.contact_sns || '-'} />
              <div>
                <Link href={`/admin/customers/${r.customer.id}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                  顧客詳細を見る &rarr;
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">顧客情報なし</p>
          )}
        </div>

        {/* ステータス */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">ステータス変更</h3>
          <form action={updateReservationStatus} className="flex gap-2">
            <input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2 rounded-lg">
              更新
            </button>
          </form>
        </div>

        {/* 担当スタッフ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">担当スタッフ</h3>
          <form action={assignStaff} className="flex gap-2">
            <input type="hidden" name="id" value={r.id} />
            <select name="staff_id" defaultValue={r.assigned_staff_id || ''} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
              <option value="">未割当</option>
              {staffs.map((s: { id: string; name: string }) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2 rounded-lg">
              割当
            </button>
          </form>
        </div>

        {/* 管理メモ */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-4">管理メモ</h3>
          <form action={updateAdminNote}>
            <input type="hidden" name="id" value={r.id} />
            <textarea
              name="admin_note"
              rows={4}
              defaultValue={r.admin_note || ''}
              placeholder="管理用のメモを入力"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3"
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-lg">
              保存
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 font-medium whitespace-nowrap">{label}</dt>
      <dd className="text-gray-900 text-right">{value}</dd>
    </div>
  )
}
