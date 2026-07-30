import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPendingProApplications } from '@/lib/queries'
import { reviewProApplication } from '@/actions/pro'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'プロ認証の審査 — MixHub' }

function snsUrl(type: string, handle: string): string {
  const h = handle.trim()
  if (h.startsWith('http')) return h
  const at = h.replace(/^@/, '')
  return type === 'instagram' ? `https://instagram.com/${at}` : `https://x.com/${at}`
}

export default async function AdminProPage() {
  const user = await getCurrentUser()
  if (!user?.profile?.is_admin) notFound()

  const apps = await getPendingProApplications()

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-4 text-2xl" style={{ fontWeight: 800 }}>プロ認証の審査</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        SNSアカウントを開いて、シーシャ店在籍が確認できたら「承認」してください。承認すると認証マークが付きます。
      </p>

      {apps.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          審査待ちの申請はありません。
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {apps.map((app) => (
            <div key={app.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate" style={{ fontWeight: 700 }}>
                    {app.user?.display_name || `@${app.user?.username ?? '—'}`}
                  </div>
                  {app.user?.username && (
                    <Link href={`/u/${app.user.username}`} className="text-xs" style={{ color: 'var(--color-ember-hot)' }}>
                      @{app.user.username}
                    </Link>
                  )}
                </div>
                <span className="chip">{app.sns_type === 'instagram' ? 'Instagram' : 'X'}</span>
              </div>

              <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                <div className="flex gap-2">
                  <dt style={{ color: 'var(--color-ash-dim)' }}>在籍店</dt>
                  <dd style={{ fontWeight: 600 }}>{app.shop_name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: 'var(--color-ash-dim)' }}>SNS</dt>
                  <dd>
                    <a
                      href={snsUrl(app.sns_type, app.sns_handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
                    >
                      {app.sns_handle} ↗
                    </a>
                  </dd>
                </div>
                {app.message && (
                  <div className="flex gap-2">
                    <dt style={{ color: 'var(--color-ash-dim)' }}>補足</dt>
                    <dd style={{ color: 'var(--color-ash)' }}>{app.message}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex gap-2">
                <form action={reviewProApplication}>
                  <input type="hidden" name="id" value={app.id} />
                  <input type="hidden" name="approve" value="true" />
                  <button type="submit" className="btn btn-ember text-sm">承認する</button>
                </form>
                <form action={reviewProApplication}>
                  <input type="hidden" name="id" value={app.id} />
                  <input type="hidden" name="approve" value="false" />
                  <button type="submit" className="btn btn-ghost text-sm">却下</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
