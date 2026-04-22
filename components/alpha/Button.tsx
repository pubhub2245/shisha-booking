'use client'

import Link from 'next/link'

type Variant = 'default' | 'gold' | 'inverted'
type Size = 'normal' | 'header'

type ButtonProps = {
  variant?: Variant
  size?: Size
  href?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<Variant, {
  border: string
  color: string
  hoverColor: string
  bgFill: string
}> = {
  default: {
    border: 'var(--color-ink)',
    color: 'var(--color-ink)',
    hoverColor: 'var(--color-paper)',
    bgFill: 'var(--color-ink)',
  },
  gold: {
    border: 'var(--color-gold)',
    color: 'var(--color-ink)',
    hoverColor: 'var(--color-ink)',
    bgFill: 'var(--color-gold)',
  },
  inverted: {
    border: 'var(--color-paper)',
    color: 'var(--color-paper)',
    hoverColor: 'var(--color-ink)',
    bgFill: 'var(--color-gold)',
  },
}

export function Button({
  variant = 'default',
  size = 'normal',
  href,
  type = 'button',
  disabled,
  children,
  className = '',
}: ButtonProps) {
  const v = variantStyles[variant]
  const sizeClass = size === 'header'
    ? 'px-[18px] py-[9px] text-[0.82rem] tracking-[0.12em] max-[900px]:px-[18px] max-[900px]:py-[9px] max-[900px]:text-[0.82rem]'
    : 'px-[26px] py-[12px] text-[0.95rem] tracking-[0.16em]'

  const baseClasses = `
    group relative inline-flex items-center gap-[0.9em]
    overflow-hidden isolate
    transition-colors duration-[550ms] ease-out
    ${sizeClass}
    ${disabled ? 'opacity-40 pointer-events-none' : ''}
    ${className}
  `.trim()

  const style = {
    fontFamily: 'var(--font-serif-en)',
    border: `1px solid ${v.border}`,
    color: v.color,
  }

  const inner = (
    <>
      {/* Background fill that slides up on hover */}
      <span
        className="absolute inset-0 -z-10 translate-y-[101%] transition-transform duration-[550ms] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:translate-y-0"
        style={{ background: v.bgFill }}
        aria-hidden="true"
      />
      <span
        className="relative transition-colors duration-[550ms]"
        style={{ ['--hover-color' as string]: v.hoverColor }}
      >
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        style={style}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = v.hoverColor
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = v.color
        }}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={baseClasses}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = v.hoverColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = v.color
      }}
    >
      {inner}
    </button>
  )
}
