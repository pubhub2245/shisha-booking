import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getClickStats } from '@/lib/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: '送客クリック集計' }

export default async function AdminClicksPage() {
  const user = await getCurrentUser()
  if (!user?.profile?.is_admin) notFound()

  const stats = await getClickStats()
  const maxFlavor = Math.max(1, ...stats.byFlavor.map((f) => f.count))
  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count))

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-4 text-2xl" style={{ fontWeight: 800 }}>📊 送客クリック集計</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        購入・来店リンク（/go 経由）のクリック数。アフィリエイト提携の交渉材料になります。
      </p>

      {/* サマリー */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { l: '累計', v: stats.total },
          { l: '直近7日', v: stats.last7 },
          { l: '直近30日', v: stats.last30 },
        ].map((s) => (
          <div key={s.l} className="card p-4 text-center">
            <div className="text-2xl" style={{ fontWeight: 800 }}>{s.v}</div>
            <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {stats.total === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
          まだクリックの記録がありません。購入リンクがクリックされると、ここに集計されます。
        </div>
      ) : (
        <>
          {/* フレーバー別 */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm" style={{ fontWeight: 700 }}>フレーバー別クリック（上位）</h2>
            <div className="card flex flex-col gap-2 p-5">
              {stats.byFlavor.map((f) => (
                <div key={f.id ?? f.label} className="flex items-center gap-3">
                  <Link href={f.id ? `/flavor/${f.id}` : '#'} className="w-40 shrink-0 truncate text-sm" style={{ color: 'var(--color-cream)' }}>
                    {f.label}
                  </Link>
                  <div className="h-2.5 flex-1 rounded-full" style={{ background: 'var(--line)' }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${(f.count / maxFlavor) * 100}%`, background: 'var(--color-ember)' }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs" style={{ fontWeight: 700 }}>{f.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 日別 */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm" style={{ fontWeight: 700 }}>日別クリック（直近14日）</h2>
            <div className="card flex flex-col gap-2 p-5">
              {stats.byDay.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>{d.day}</span>
                  <div className="h-2.5 flex-1 rounded-full" style={{ background: 'var(--line)' }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${(d.count / maxDay) * 100}%`, background: 'var(--color-coal)' }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs" style={{ fontWeight: 700 }}>{d.count}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
