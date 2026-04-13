import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getBars, createBar, updateBar, deleteBar } from '@/actions/reservations'

export const dynamic = 'force-dynamic'
import Link from 'next/link'

const AREAS = [
  '宮崎市内（西橘周辺）',
  '都城市内（牟田町周辺）',
  '鹿児島市内（天文館周辺）',
]

export default async function BarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const bars = await getBars()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-900 text-sm">&larr; 管理画面</Link>
          <h1 className="text-xl font-bold text-gray-900">バー管理</h1>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* 新規登録フォーム */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">バーを追加</h2>
          <form action={createBar} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="バー名"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
            />
            <input
              type="text"
              name="address"
              required
              placeholder="住所"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
            />
            <select name="area" required className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
              <option value="">エリア選択</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
              追加
            </button>
          </form>
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-bold text-gray-900">登録済みバー ({bars.length})</h2>
          </div>
          {bars.length === 0 ? (
            <div className="text-center py-12 text-gray-500">バーが登録されていません</div>
          ) : (
            <div className="divide-y">
              {bars.map((bar: { id: string; name: string; address: string; area: string }) => (
                <div key={bar.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <form action={updateBar} className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input type="hidden" name="id" value={bar.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={bar.name}
                      required
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                    />
                    <input
                      type="text"
                      name="address"
                      defaultValue={bar.address}
                      required
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                    />
                    <select name="area" defaultValue={bar.area} required className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm">
                      {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 rounded-lg transition-colors">
                      更新
                    </button>
                  </form>
                  <form action={deleteBar}>
                    <input type="hidden" name="id" value={bar.id} />
                    <button type="submit" className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors">
                      削除
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
