'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from './Button'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgb(239 231 215 / 0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(1.1)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(1.1)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--color-line-soft)'
          : '1px solid transparent',
      }}
    >
      <div className="wrap flex items-center justify-between py-[22px]">
        <Link href="/" className="flex items-baseline gap-[0.55em]" style={{ fontFamily: 'var(--font-serif-en)' }}>
          <span className="text-[1.4rem] font-normal tracking-[0.02em]">Alpha</span>
          <span
            className="w-[6px] h-[6px] rounded-full mx-[2px]"
            style={{
              background: 'var(--color-gold)',
              transform: 'translateY(-2px)',
              boxShadow: '0 0 14px rgb(168 133 58 / 0.5)',
            }}
            aria-hidden="true"
          />
          <span className="text-[1.4rem] font-light italic" style={{ color: 'var(--ink-75)' }}>
            Lounge
          </span>
        </Link>
        <Button href="#apply" variant="default" size="header">
          Apply <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
        </Button>
      </div>
    </header>
  )
}
