import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllFlavors, createFlavor, updateFlavor, deleteFlavor } from '@/actions/reservations'
import AdminShell from '../_components/admin-shell'

export const dynamic = 'force-dynamic'

export default async function FlavorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const flavors = await getAllFlavors()

  return (
    <AdminShell active="flavors" userEmail={user.email}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">フレーバー管理</h2>
      <div className="space-y-6">
        {/* 新規登録フォーム */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">フレーバーを追加</h2>
          <form action={createFlavor} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="フレーバー名"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
            />
            <input
              type="number"
              name="stock"
              required
              min="0"
              placeholder="在庫数"
              defaultValue="10"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
              追加
            </button>
          </form>
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-bold text-gray-900">登録済みフレーバー ({flavors.length})</h2>
          </div>
          {flavors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">フレーバーが登録されていません</div>
          ) : (
            <div className="divide-y">
              {flavors.map((f: { id: string; name: string; stock: number }) => (
                <div key={f.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <form action={updateFlavor} className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input type="hidden" name="id" value={f.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={f.name}
                      required
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="stock"
                        defaultValue={f.stock}
                        required
                        min="0"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm w-24"
                      />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        f.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {f.stock > 0 ? `在庫 ${f.stock}` : '在庫切れ'}
                      </span>
                    </div>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 rounded-lg transition-colors">
                      更新
                    </button>
                  </form>
                  <form action={deleteFlavor}>
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors">
                      削除
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
