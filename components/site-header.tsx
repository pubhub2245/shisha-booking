import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUnreadNotificationCount } from '@/lib/queries'
import { signOut } from '@/actions/auth'
import { BRAND } from '@/lib/site'
import { IconSearch, IconBell } from '@/components/nav-icons'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const displayName = user?.profile?.display_name || user?.profile?.username || user?.email?.split('@')[0]
  const unread = user ? await getUnreadNotificationCount() : 0

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--surface-blur)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        {/* ロゴ。赤い角丸に白抜きの「煙」はやめた。暗い地の上では印そのものが安く見える。
            代わりに字の左へ一本の煙を立てる。下が火の色、上へ行くほど消える。 */}
        <Link href="/" className="mark" aria-label={`${BRAND.full} ホーム`}>
          <span className="mark-flue" aria-hidden />
          <span className="flex items-baseline gap-2">
            <span className="mark-name">{BRAND.name}</span>
            <span className="mark-en">{BRAND.nameEn}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: 'var(--color-ash)' }}>
          <Link href="/" className="brush-underline transition-colors hover:text-[var(--color-cream)]">フレーバー</Link>
          {/* いま実際に進んでいる場所を、王道より前に置く（王道は現時点で0件） */}
          <Link href="/theme" className="brush-underline transition-colors hover:text-[var(--color-cream)]" style={{ fontWeight: 700 }}>今月の検証</Link>
          {/* 王道は「そのフレーバーで認定された作り方」。現時点では0件 */}
          <Link href="/national" className="brush-underline transition-colors hover:text-[var(--color-cream)]">王道</Link>
          <Link href="/guide" className="brush-underline transition-colors hover:text-[var(--color-cream)]">作り方</Link>
          {user && <Link href="/shelf" className="brush-underline transition-colors hover:text-[var(--color-cream)]">マイフレーバー</Link>}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="検索"
            className="hidden h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-tint)] md:flex"
            style={{ color: 'var(--color-ash)' }}
          >
            <IconSearch />
          </Link>
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label="通知"
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-tint)]"
                style={{ color: 'var(--color-ash)' }}
              >
                <IconBell />
                {unread > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] text-white"
                    style={{ background: 'var(--color-ember)', fontWeight: 700 }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link href="/post" className="btn btn-ember hidden text-sm md:inline-flex">
                作り方を登録
              </Link>
              <Link
                href="/mypage"
                className="hidden max-w-[9rem] truncate text-sm transition-colors hover:text-[var(--color-ember-hot)] md:inline-block"
                title={`マイ煙道（${displayName}）`}
              >
                {user.profile?.username ? `@${user.profile.username}` : displayName}
              </Link>
              <form action={signOut} className="hidden md:block">
                <button type="submit" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm" style={{ color: 'var(--color-ash)' }}>
                ログイン
              </Link>
              <Link href="/signup" className="btn btn-ember text-sm">
                はじめる
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
