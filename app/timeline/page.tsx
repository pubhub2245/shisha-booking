import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getFollowingMixes, getLikedMixIds } from '@/lib/queries'
import { MixCard } from '@/components/mix-card'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'タイムライン — MixHub' }

export default async function TimelinePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/timeline')

  const [mixes, likedIds] = await Promise.all([getFollowingMixes(), getLikedMixIds()])

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Timeline</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>タイムライン</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        フォロー中の人が投稿した新着ミックス。
      </p>

      {mixes.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {mixes.map((m) => (
            <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed />
          ))}
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>まだ何もありません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            気になる投稿者や店舗をフォローすると、ここに新着が集まります。
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/" className="btn btn-ember">図鑑で探す</Link>
            <Link href="/ranking" className="btn btn-ghost">人気から探す</Link>
          </div>
        </div>
      )}
    </div>
  )
}
