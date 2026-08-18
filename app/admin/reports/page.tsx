import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getReports } from '@/lib/queries'
import { adminDismissReport, adminDeleteMix, adminRestoreContent } from '@/actions/admin'
import { relativeTime } from '@/lib/time'

export const dynamic = 'force-dynamic'
export const metadata = { title: '通報の管理 — 煙道' }

export default async function AdminReportsPage() {
  const user = await getCurrentUser()
  if (!user?.profile?.is_admin) notFound()

  const reports = await getReports()

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 800 }}>🛡 通報の管理</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        未対応の通報 {reports.length} 件。内容を確認し、問題なければ「対応済み」、不適切なら「投稿を削除」してください。
        <br />※ 異なる3人以上から通報された投稿・コメントは<b>自動で非表示</b>になります。誤検知なら「非表示を解除して公開」で戻せます。
      </p>

      {reports.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          未対応の通報はありません。
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {r.mix_id ? (
                    <Link href={`/mix/${r.mix_id}`} className="text-sm underline underline-offset-2" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                      {r.mixTitle ?? '（削除済み/不明な作り方）'}
                    </Link>
                  ) : (
                    <span className="text-sm" style={{ fontWeight: 700 }}>コメントへの通報</span>
                  )}
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    通報者：{r.reporter?.display_name || (r.reporter?.username ? `@${r.reporter.username}` : '不明')} ・ {relativeTime(r.created_at)}
                  </p>
                </div>
              </div>
              {r.reason && (
                <p className="mt-2 rounded-lg border p-2.5 text-sm" style={{ borderColor: 'var(--line)', color: 'var(--color-ash)' }}>
                  {r.reason}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={adminDismissReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="btn btn-ghost text-xs">✓ 対応済みにする</button>
                </form>
                {r.mix_id && (
                  <form action={adminDeleteMix}>
                    <input type="hidden" name="mix_id" value={r.mix_id} />
                    <button
                      type="submit"
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{ borderColor: 'var(--color-ember-deep)', color: 'var(--color-ember-deep)', fontWeight: 600 }}
                    >
                      🗑 投稿を削除
                    </button>
                  </form>
                )}
                {/* 自動非表示の誤検知を救済（公開に戻す） */}
                <form action={adminRestoreContent}>
                  {r.mix_id && <input type="hidden" name="mix_id" value={r.mix_id} />}
                  {r.comment_id && <input type="hidden" name="comment_id" value={r.comment_id} />}
                  <button type="submit" className="btn btn-ghost text-xs">↩ 非表示を解除して公開</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
