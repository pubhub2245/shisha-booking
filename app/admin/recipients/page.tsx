import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getNotificationRecipients,
  createNotificationRecipient,
  updateNotificationRecipient,
  deleteNotificationRecipient,
  getLineWebhookUsers,
  registerLineUser,
  dismissLineUser,
  getAreas,
} from '@/actions/reservations'
import AdminShell from '../_components/admin-shell'

export const dynamic = 'force-dynamic'

export default async function RecipientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [recipients, areas, webhookUsers] = await Promise.all([
    getNotificationRecipients(),
    getAreas(),
    getLineWebhookUsers(),
  ])
  const areaLabels = areas.map((a: { label: string }) => a.label)

  return (
    <AdminShell active="recipients" userEmail={user.email}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">通知先管理</h2>
      <p className="text-sm text-gray-500 mb-6">
        予約が入ったとき、担当エリアが一致するスタッフに LINE とメールで通知します。
      </p>

      <div className="space-y-6">
        {/* LINE 未登録ユーザー */}
        {webhookUsers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-green-800 mb-2">
              LINE から新しいユーザーが見つかりました ({webhookUsers.length}件)
            </h3>
            <p className="text-sm text-green-700 mb-4">
              公式アカウントにメッセージを送った人です。「スタッフ登録」ボタンで通知先に追加できます。
            </p>
            <div className="space-y-4">
              {webhookUsers.map((wu: {
                id: string
                line_user_id: string
                display_name: string | null
                message: string | null
                updated_at: string
              }) => (
                <div key={wu.id} className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {wu.display_name || '名前未取得'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        ID: {wu.line_user_id}
                      </p>
                      {wu.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          最新メッセージ: 「{wu.message}」
                        </p>
                      )}
                    </div>
                    <form action={dismissLineUser}>
                      <input type="hidden" name="webhook_user_id" value={wu.id} />
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        非表示
                      </button>
                    </form>
                  </div>
                  <form action={registerLineUser} className="space-y-3">
                    <input type="hidden" name="webhook_user_id" value={wu.id} />
                    <input type="hidden" name="line_user_id" value={wu.line_user_id} />
                    <input type="hidden" name="display_name" value={wu.display_name ?? ''} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="name"
                        defaultValue={wu.display_name ?? ''}
                        placeholder="スタッフ名"
                        required
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 placeholder-gray-500 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1.5">担当エリア（1つ以上選択）</p>
                      <div className="flex flex-wrap gap-3">
                        {areaLabels.map((label: string) => (
                          <label key={label} className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input type="checkbox" name="area_labels" value={label} className="rounded" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-5 rounded-lg text-sm transition-colors"
                    >
                      スタッフ登録
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 新規登録（手動） */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">スタッフを追加（手動入力）</h3>
          <form action={createNotificationRecipient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                name="name"
                required
                placeholder="スタッフ名"
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
              />
              <input
                type="text"
                name="line_user_id"
                placeholder="LINE ユーザーID（任意）"
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
              />
              <input
                type="email"
                name="email"
                placeholder="メールアドレス（任意）"
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">担当エリア（1つ以上選択）</p>
              <div className="flex flex-wrap gap-3">
                {areaLabels.map((label: string) => (
                  <label key={label} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input type="checkbox" name="area_labels" value={label} className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
            >
              追加
            </button>
          </form>
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-bold text-gray-900">登録済みスタッフ ({recipients.length})</h3>
          </div>
          {recipients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">通知先が登録されていません</div>
          ) : (
            <div className="divide-y">
              {recipients.map((r: {
                id: string
                name: string
                line_user_id: string | null
                email: string | null
                area_labels: string[]
                is_active: boolean
              }) => (
                <div key={r.id} className="px-6 py-4">
                  <form action={updateNotificationRecipient} className="space-y-3">
                    <input type="hidden" name="id" value={r.id} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        name="name"
                        defaultValue={r.name}
                        required
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm"
                      />
                      <input
                        type="text"
                        name="line_user_id"
                        defaultValue={r.line_user_id ?? ''}
                        placeholder="LINE ユーザーID"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 placeholder-gray-500 text-sm"
                      />
                      <input
                        type="email"
                        name="email"
                        defaultValue={r.email ?? ''}
                        placeholder="メールアドレス"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 placeholder-gray-500 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {areaLabels.map((label: string) => (
                        <label key={label} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            name="area_labels"
                            value={label}
                            defaultChecked={r.area_labels.includes(label)}
                            className="rounded"
                          />
                          {label}
                        </label>
                      ))}
                      <label className="flex items-center gap-1.5 text-sm text-gray-700 ml-4">
                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={r.is_active}
                          className="rounded"
                        />
                        有効
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors"
                      >
                        更新
                      </button>
                      <button
                        type="submit"
                        formAction={deleteNotificationRecipient}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors"
                      >
                        削除
                      </button>
                    </div>
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
