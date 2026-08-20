import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getRecommendedMethods } from '@/lib/queries'
import { certifyOrthodoxy, revokeOrthodoxy } from '@/actions/orthodoxy'
import { flavorLine } from '@/lib/mix'
import { relativeTime } from '@/lib/time'

export const dynamic = 'force-dynamic'
export const metadata = { title: '王道の認定' }

export default async function AdminOrthodoxyPage() {
  const user = await getCurrentUser()
  if (!user?.profile?.is_admin) notFound()

  const items = await getRecommendedMethods()

  async function certify(formData: FormData) {
    'use server'
    await certifyOrthodoxy(String(formData.get('mix_id') ?? ''), String(formData.get('combo_key') ?? '') || undefined)
  }
  async function revoke(formData: FormData) {
    'use server'
    await revokeOrthodoxy(String(formData.get('combo_key') ?? ''))
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 800 }}>王道の認定</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        運営・認証プロから<b>推薦</b>された作り方の一覧です。1つのフレーバーにつき王道は1つだけ。
        別の作り方を認定すると、そのフレーバーの王道は自動的に入れ替わります（履歴は保存されます）。
        <br />※ 王道は単純な票数では決めません。推薦は「候補の発見」のための材料です。
      </p>

      {items.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          推薦された作り方はまだありません。
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map(({ mix, recommendCount, isOrthodox }) => (
            <li key={mix.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/method/${mix.id}`}
                    className="text-sm underline underline-offset-2"
                    style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}
                  >
                    {flavorLine(mix.mix_flavors) || mix.title || '作り方'}
                  </Link>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    推薦 {recommendCount} ・ フレーバー: {mix.combo_key} ・ {relativeTime(mix.created_at)}
                  </p>
                </div>
                {isOrthodox && (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs"
                    style={{ background: 'var(--color-seal)', color: '#fff', fontWeight: 800 }}
                  >
                    王道
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {!isOrthodox && (
                  <form action={certify}>
                    <input type="hidden" name="mix_id" value={mix.id} />
                    <input type="hidden" name="combo_key" value={mix.combo_key} />
                    <button type="submit" className="btn btn-ember text-xs">王道に認定</button>
                  </form>
                )}
                {isOrthodox && (
                  <form action={revoke}>
                    <input type="hidden" name="combo_key" value={mix.combo_key} />
                    <button type="submit" className="btn btn-ghost text-xs">王道を解除</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
