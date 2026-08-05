import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="wrap flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="brand-mark text-lg">
            Mix<span className="ember-text">Hub</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            日本のシーシャの「美味しい」を、みんなで育てる図鑑。
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          <Link href="/" className="hover:text-[var(--color-cream)]">図鑑</Link>
          <Link href="/flavors" className="hover:text-[var(--color-cream)]">フレーバー</Link>
          <Link href="/ranking" className="hover:text-[var(--color-cream)]">ランキング</Link>
          <Link href="/post" className="hover:text-[var(--color-cream)]">投稿する</Link>
          <Link href="/shops" className="hover:text-[var(--color-cream)]">店舗一覧</Link>
          <Link href="/for-shops" className="hover:text-[var(--color-cream)]">店舗の方へ</Link>
          <Link href="/about" className="hover:text-[var(--color-cream)]">MixHubとは</Link>
        </nav>
      </div>
      <div className="wrap flex flex-col gap-3 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          <Link href="/legal/terms" className="hover:text-[var(--color-cream)]">利用規約</Link>
          <Link href="/legal/privacy" className="hover:text-[var(--color-cream)]">プライバシーポリシー</Link>
          <Link href="/legal/tokushoho" className="hover:text-[var(--color-cream)]">特定商取引法に基づく表記</Link>
        </nav>
        <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          © {new Date().getFullYear()} MixHub. リンクにはアフィリエイトを含む場合があります。
        </div>
      </div>
    </footer>
  )
}
