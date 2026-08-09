import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getNotifications, markAllNotificationsRead } from '@/lib/queries'
import { Avatar } from '@/components/avatar'
import { relativeTime } from '@/lib/time'
import type { MixAuthor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = { title: '通知 — MixHub' }

function actorName(a: MixAuthor | null): string {
  return a?.display_name || (a?.username ? `@${a.username}` : '誰か')
}

const VERB: Record<string, string> = {
  like: 'があなたのミックスにいいねしました',
  comment: 'があなたのミックスにコメントしました',
  follow: 'があなたをフォローしました',
  make: 'があなたのミックスを「作った！」しました',
  reply: 'があなたのコメントに返信しました',
  mention: 'がコメントであなたに言及しました',
  comment_like: 'があなたのコメントにいいねしました',
}

const ICON: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  follow: '➕',
  make: '🎉',
  reply: '↩️',
  mention: '＠',
  comment_like: '❤️',
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/notifications')

  const items = await getNotifications()
  // 表示したら既読にする（次回以降バッジが消える）
  await markAllNotificationsRead()

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>通知</h1>

      {items.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <div className="text-3xl" aria-hidden>🔔</div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            通知はまだありません。<br />ミックスを投稿すると、いいねやコメントがここに届きます。
          </p>
          <Link href="/post" className="btn btn-ember mt-4 text-sm">＋ ミックスを投稿</Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((n) => {
            const name = actorName(n.actor)
            const href = n.type === 'follow'
              ? (n.actor?.username ? `/u/${n.actor.username}` : '/notifications')
              : (n.mix ? `/mix/${n.mix.id}` : '/notifications')
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className="card card-hover flex items-center gap-3 p-4"
                  style={!n.read ? { borderColor: 'var(--color-ember)', background: 'var(--accent-tint)' } : undefined}
                >
                  <div className="relative shrink-0">
                    <Avatar name={n.actor?.display_name || n.actor?.username || '?'} seed={n.actor_id || String(n.id)} size={40} />
                    <span className="absolute -bottom-1 -right-1 text-sm" aria-hidden>{ICON[n.type] ?? '🔔'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug" style={{ color: 'var(--color-cream)' }}>
                      <span style={{ fontWeight: 700 }}>{name}</span>
                      <span style={{ color: 'var(--color-ash)' }}>{VERB[n.type] ?? 'の通知'}</span>
                    </p>
                    {n.mix && (
                      <p className="truncate text-xs" style={{ color: 'var(--color-ash-dim)' }}>「{n.mix.title}」</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--color-ash-dim)' }}>{relativeTime(n.created_at)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
