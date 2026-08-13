import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUnreadNotificationCount } from '@/lib/queries'
import { resolveMode } from '@/lib/mode'
import { ModeSwitch } from '@/components/mode-switch'
import { signOut } from '@/actions/auth'
import { BRAND } from '@/lib/site'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const displayName = user?.profile?.display_name || user?.profile?.username || user?.email?.split('@')[0]
  const unread = user ? await getUnreadNotificationCount() : 0
  const mode = resolveMode(user?.profile)
  const isPro = mode === 'pro'

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
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.full} ホーム`}>
          <span
            aria-hidden
            className="brand-mark seal-stamp flex h-8 w-8 items-center justify-center rounded-md text-lg"
            style={{
              background: 'var(--color-seal)',
              color: '#fbf8f0',
              boxShadow: '0 3px 10px -5px rgb(178 59 46 / 0.6), 0 0 0 1px rgb(178 59 46 / 0.25) inset',
            }}
            title={`${BRAND.mark}（${BRAND.name}）`}
          >
            {BRAND.mark}
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="brand-mark text-xl">{BRAND.name}</span>
            <span
              className="brand-mark"
              style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--color-ember-hot)' }}
            >
              {BRAND.nameEn}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: 'var(--color-ash)' }}>
          <Link href="/" className="brush-underline transition-colors hover:text-[var(--color-cream)]">図鑑</Link>
          {/* ランキング系（王道/地域別/人気）は王道ページ上部のタブで束ねる */}
          <Link href="/national" className="brush-underline transition-colors hover:text-[var(--color-cream)]" style={{ fontWeight: 700 }}>王道</Link>
          <Link href="/flavors" className="brush-underline transition-colors hover:text-[var(--color-cream)]">フレーバー</Link>
          {/* プロは深掘り導線、初心者は学習導線 */}
          {isPro ? (
            user && <Link href="/shelf" className="brush-underline transition-colors hover:text-[var(--color-cream)]">マイフレーバー</Link>
          ) : (
            <Link href="/guide" className="brush-underline transition-colors hover:text-[var(--color-cream)]">作り方</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user && <ModeSwitch mode={mode} />}
          <Link
            href="/search"
            aria-label="検索"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--accent-tint)] md:flex"
            style={{ color: 'var(--color-ash)' }}
          >
            🔍
          </Link>
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label="通知"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[var(--accent-tint)]"
                style={{ color: 'var(--color-ash)' }}
              >
                🔔
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
                ミックスを投稿
              </Link>
              <Link
                href="/mypage"
                className="hidden max-w-[9rem] truncate text-sm transition-colors hover:text-[var(--color-ember-hot)] md:inline-block"
                title={displayName}
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
