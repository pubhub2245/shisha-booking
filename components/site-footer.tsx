import Link from 'next/link'
import { BRAND } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="pattern-seigaiha mt-24 border-t" style={{ borderColor: 'var(--line)' }}>
      {/* 界線（けいせん）＝中央に朱点を置く仕切り */}
      <div className="wrap pt-10">
        <div className="kaisen" aria-hidden>
          <span className="seal-dot" />
        </div>
      </div>
      <div className="wrap flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="brand-mark text-lg">
              <ruby>{BRAND.name}<rt>{BRAND.reading}</rt></ruby>
            </span>
            <span
              className="brand-mark"
              style={{ fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--color-ember-hot)' }}
            >
              {BRAND.nameEn}
            </span>
          </div>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-cream)', fontWeight: 600 }}>
            {BRAND.tagline}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            日本のシーシャの「美味しい」を、みんなで育てる{BRAND.category}。
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          <Link href="/" className="brush-underline hover:text-[var(--color-cream)]">図鑑</Link>
          <Link href="/national" className="brush-underline hover:text-[var(--color-cream)]">🇯🇵 日本代表</Link>
          <Link href="/areas" className="brush-underline hover:text-[var(--color-cream)]">地域別ランキング</Link>
          <Link href="/flavors" className="brush-underline hover:text-[var(--color-cream)]">フレーバー</Link>
          <Link href="/ranking" className="brush-underline hover:text-[var(--color-cream)]">ランキング</Link>
          <Link href="/guide" className="brush-underline hover:text-[var(--color-cream)]">作り方ガイド</Link>
          <Link href="/post" className="brush-underline hover:text-[var(--color-cream)]">投稿する</Link>
          <Link href="/shops" className="brush-underline hover:text-[var(--color-cream)]">店舗一覧</Link>
          <Link href="/for-shops" className="brush-underline hover:text-[var(--color-cream)]">店舗の方へ</Link>
          <Link href="/founders" className="brush-underline hover:text-[var(--color-cream)]">創設メンバー募集</Link>
          <Link href="/ideas" className="brush-underline hover:text-[var(--color-cream)]">意見箱</Link>
          <Link href="/about" className="brush-underline hover:text-[var(--color-cream)]">{BRAND.name}とは</Link>
        </nav>
      </div>
      <div className="wrap flex flex-col gap-3 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          <Link href="/legal/terms" className="brush-underline hover:text-[var(--color-cream)]">利用規約</Link>
          <Link href="/legal/privacy" className="brush-underline hover:text-[var(--color-cream)]">プライバシーポリシー</Link>
          <Link href="/legal/tokushoho" className="brush-underline hover:text-[var(--color-cream)]">特定商取引法に基づく表記</Link>
        </nav>
        <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          © {new Date().getFullYear()} {BRAND.nameEn}. リンクにはアフィリエイトを含む場合があります。
        </div>
      </div>
    </footer>
  )
}
