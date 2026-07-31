import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/actions/auth'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const displayName = user?.profile?.display_name || user?.profile?.username || user?.email?.split('@')[0]

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: 'var(--line)',
        background: 'rgb(247 244 238 / 0.82)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="brand-mark flex h-8 w-8 items-center justify-center rounded-xl text-lg text-white"
            style={{
              background: 'linear-gradient(145deg, var(--color-coal), var(--color-ember))',
              boxShadow: '0 6px 14px -6px rgb(31 138 118 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.3)',
            }}
          >
            M
          </span>
          <span className="brand-mark text-xl">
            Mix<span className="ember-text">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: 'var(--color-ash)' }}>
          <Link href="/" className="transition-colors hover:text-[var(--color-cream)]">図鑑</Link>
          <Link href="/flavors" className="transition-colors hover:text-[var(--color-cream)]">フレーバー</Link>
          <Link href="/ranking" className="transition-colors hover:text-[var(--color-cream)]">ランキング</Link>
          {user && <Link href="/timeline" className="transition-colors hover:text-[var(--color-cream)]">タイムライン</Link>}
          <Link href="/post" className="transition-colors hover:text-[var(--color-cream)]">投稿する</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/post" className="btn btn-ember hidden text-sm sm:inline-flex">
                ミックスを投稿
              </Link>
              <Link
                href="/mypage"
                className="max-w-[9rem] truncate text-sm transition-colors hover:text-[var(--color-ember-hot)]"
                title={displayName}
              >
                @{user.profile?.username || displayName}
              </Link>
              <form action={signOut}>
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
