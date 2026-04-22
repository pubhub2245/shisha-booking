import Link from 'next/link'

export function Footer() {
  return (
    <footer
      className="py-[70px] pb-[40px]"
      style={{
        background: 'var(--color-ink-soft)',
        color: 'rgb(239 231 215 / 0.6)',
        borderTop: '1px solid rgb(239 231 215 / 0.1)',
      }}
    >
      <div className="wrap">
        {/* 4-column grid */}
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-[50px] mb-[50px] max-[900px]:grid-cols-2 max-[900px]:gap-[36px] max-[560px]:grid-cols-1">
          {/* Brand */}
          <div>
            <div
              className="text-[1.6rem] mb-[14px] tracking-[0.02em]"
              style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-paper)' }}
            >
              Alpha &middot; Lounge
            </div>
            <p className="text-[0.86rem] leading-[1.9] max-w-[280px]">
              経営者のための、静かなラウンジ体験。<br />
              厳選された提携会場でのみ、お届けします。
            </p>
          </div>

          {/* Navigation */}
          <div>
            <FooterHeading>Navigation</FooterHeading>
            <ul className="grid gap-[10px]">
              <li><FooterLink href="#whom">For Whom</FooterLink></li>
              <li><FooterLink href="#venues">Venues</FooterLink></li>
              <li><FooterLink href="#pricing">Membership</FooterLink></li>
              <li><FooterLink href="#faq">F.A.Q.</FooterLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <FooterHeading>Contact</FooterHeading>
            <ul className="grid gap-[10px]">
              <li><FooterLink href="#apply">{'\u03B2'}会員申込</FooterLink></li>
              <li><FooterLink href="#apply">会場提携のご相談</FooterLink></li>
              <li className="text-[0.88rem] tracking-[0.04em]">宮崎 ・ 都城</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <FooterHeading>Legal</FooterHeading>
            <ul className="grid gap-[10px]">
              <li><FooterLink href="#">利用規約</FooterLink></li>
              <li><FooterLink href="#">プライバシーポリシー</FooterLink></li>
              <li><FooterLink href="#">特商法表記</FooterLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex justify-between items-center flex-wrap gap-[14px] pt-[28px] text-[0.78rem] tracking-[0.14em] italic"
          style={{
            fontFamily: 'var(--font-serif-en)',
            borderTop: '1px solid rgb(239 231 215 / 0.1)',
          }}
        >
          <span>&copy; 2026 Alpha Lounge. All rights reserved.</span>
          <span>― Crafted, in Miyazaki. ―</span>
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="text-[0.85rem] tracking-[0.16em] mb-[18px] italic font-normal"
      style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}
    >
      {children}
    </h4>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[0.88rem] tracking-[0.04em] transition-colors duration-300 hover:text-[var(--color-gold-light)]"
    >
      {children}
    </Link>
  )
}
