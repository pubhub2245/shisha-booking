import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, customer:customers(name, phone)")
    .eq("assigned_staff_id", user?.id)
    .order("reservation_date", { ascending: true })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">担当予約一覧</h1>
      {!reservations?.length ? (
        <div className="text-center py-16 text-gray-500">担当予約はありません</div>
      ) : (
        <div className="space-y-4">
          {reservations.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-bold">{r.reservation_date} {r.reservation_time}</p>
              <p className="text-gray-600">{r.customer?.name} / {r.area}</p>
              <p className="text-gray-500 text-sm">{r.location}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
