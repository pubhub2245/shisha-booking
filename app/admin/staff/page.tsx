import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminShell from '../_components/admin-shell'
import { getStaffs, updateStaff, deleteStaff, getAreas } from '@/actions/reservations'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const staffs = await getStaffs()
  const areas = await getAreas()

  type Staff = {
    id: string; name: string | null; phone: string | null
    role: 'admin' | 'staff'; available_area: string | null; is_active: boolean
  }

  return (
    <AdminShell active="staff" userEmail={user.email}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">スタッフ管理</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6 text-sm">
        新規スタッフの追加はSupabase Authでアカウント作成後、このページから詳細情報を編集してください。
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">登録スタッフ ({staffs.length})</h3>
        </div>
        {staffs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">スタッフが登録されていません</div>
        ) : (
          <div className="divide-y">
            {(staffs as Staff[]).map(s => {
              const selectedAreas = (s.available_area || '').split(',').map(x => x.trim()).filter(Boolean)
              return (
                <div key={s.id} className="px-6 py-4">
                  <form action={updateStaff} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                    <input type="hidden" name="id" value={s.id} />
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">名前</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={s.name || ''}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={s.phone || ''}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">役割</label>
                      <select
                        name="role"
                        defaultValue={s.role}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                      >
                        <option value="admin">admin</option>
                        <option value="staff">staff</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-gray-900">
                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={s.is_active}
                          className="w-4 h-4"
                        />
                        稼働中
                      </label>
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-xs text-gray-500 mb-1">対応可能エリア</label>
                      <div className="flex flex-wrap gap-3">
                        {areas.map((a: { id: string; label: string }) => (
                          <label key={a.id} className="flex items-center gap-1.5 text-sm text-gray-900">
                            <input
                              type="checkbox"
                              name="available_areas"
                              value={a.label}
                              defaultChecked={selectedAreas.includes(a.label)}
                              className="w-4 h-4"
                            />
                            {a.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-6 flex gap-2 justify-end pt-2">
                      <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg">
                        更新
                      </button>
                    </div>
                  </form>
                  <form action={deleteStaff} className="flex justify-end mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 text-xs font-medium">
                      プロフィール削除
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
