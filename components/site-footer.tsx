import Link from 'next/link'
import { BRAND } from '@/lib/site'

/** 主要な導線。3列に組んで、羅列ではなく一覧として読ませる */
const LINKS: { href: string; label: string }[] = [
  { href: '/', label: '図鑑' },
  { href: '/flavors', label: 'フレーバー' },
  { href: '/national', label: '王道' },
  { href: '/theme', label: '今月の検証' },
  { href: '/guide', label: '作り方ガイド' },
  { href: '/post', label: '投稿する' },
  { href: '/shops', label: '店舗一覧' },
  { href: '/for-shops', label: '店舗の方へ' },
  { href: '/ideas', label: '意見箱' },
]

/**
 * フッター。
 * 上の帯と骨格が重ならないよう、ここは「左にブランド、右に3列の一覧」にしてある。
 * 12本のリンクを一列に流すと、それだけで既製品の見た目になる。
 */
export function SiteFooter() {
  return (
    <footer className="sect mt-16 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="wrap pt-12">
        {/* 熱の目盛り。サイト共通の署名要素をここでも罫として使う */}
        <div className="gauge-rule" aria-hidden><i /><i /><i /><i /><i /></div>
      </div>

      <div className="wrap foot-grid pb-10 pt-2">
        <div>
          <div className="mark">
            <span className="mark-flue" aria-hidden />
            <span className="flex items-baseline gap-2">
              <span className="mark-name">
                <ruby>{BRAND.name}<rt style={{ fontSize: '0.4em', letterSpacing: '0.06em' }}>{BRAND.reading}</rt></ruby>
              </span>
              <span className="mark-en">{BRAND.nameEn}</span>
            </span>
          </div>
          <p className="mt-4 text-sm" style={{ fontWeight: 600 }}>{BRAND.tagline}</p>
          <p className="mt-1.5 max-w-[28ch] text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
            日本のシーシャの「美味しい」を、みんなで育てる{BRAND.category}。
          </p>
        </div>

        <nav className="foot-links" aria-label="サイト内の主な導線">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
          <Link href="/about">{BRAND.name}とは</Link>
        </nav>
      </div>

      <div className="wrap flex flex-col gap-3 border-t pb-10 pt-6 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: 'var(--line)' }}>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          <Link href="/legal/terms" className="brush-underline hover:text-[var(--color-cream)]">利用規約</Link>
          <Link href="/legal/privacy" className="brush-underline hover:text-[var(--color-cream)]">プライバシーポリシー</Link>
          <Link href="/legal/tokushoho" className="brush-underline hover:text-[var(--color-cream)]">特定商取引法に基づく表記</Link>
        </nav>
        <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {/* 生成した絵を実写のように見せない。出所は自分から言う */}
          <p>トップの背景映像はAIで生成したものです。</p>
          <p className="mt-1">
            © {new Date().getFullYear()} {BRAND.nameEn}. リンクにはアフィリエイトを含む場合があります。
          </p>
        </div>
      </div>
    </footer>
  )
}
