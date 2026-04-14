import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  // role確認
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/staff")
  }

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, customer:customers(name, phone)")
    .order("reservation_date", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/api/signout" method="post">
              <button className="text-sm text-red-500 hover:text-red-700">ログアウト</button>
            </form>
          </div>
        </div>
        <nav className="flex gap-4">
          <Link href="/admin" className="text-sm font-medium text-amber-600 border-b-2 border-amber-500 pb-1">予約一覧</Link>
          <Link href="/admin/bars" className="text-sm font-medium text-gray-500 hover:text-gray-900 pb-1">バー管理</Link>
          <Link href="/admin/flavors" className="text-sm font-medium text-gray-500 hover:text-gray-900 pb-1">フレーバー管理</Link>
        </nav>
      </header>

      <main className="p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">総予約数</p>
            <p className="text-3xl font-bold text-gray-900">{reservations?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">待機中</p>
            <p className="text-3xl font-bold text-yellow-500">
              {reservations?.filter((r: { status: string }) => r.status === "pending" || r.status === "received").length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">確定済み</p>
            <p className="text-3xl font-bold text-green-500">
              {reservations?.filter((r: { status: string }) => r.status === "confirmed").length ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-bold text-gray-900">予約一覧</h2>
          </div>
          {!reservations?.length ? (
            <div className="text-center py-16 text-gray-500">予約はまだありません</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">日時</th>
                  <th className="px-4 py-3 text-left">お客様</th>
                  <th className="px-4 py-3 text-left">エリア</th>
                  <th className="px-4 py-3 text-left">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r: { id: string; reservation_date: string; reservation_time: string; customer: { name: string } | null; area: string; status: string }) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{r.reservation_date} {r.reservation_time}</td>
                    <td className="px-4 py-3 text-gray-900">{r.customer?.name}</td>
                    <td className="px-4 py-3 text-gray-900">{r.area}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "confirmed" ? "bg-green-100 text-green-700" :
                        r.status === "pending" || r.status === "received" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{statusLabel(r.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

function statusLabel(s: string): string {
  switch (s) {
    case 'received': return '受付済み'
    case 'pending': return '保留中'
    case 'confirmed': return '確定'
    case 'cancelled': return 'キャンセル'
    case 'closed': return '完了'
    default: return s
  }
}
