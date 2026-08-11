import type { ReactNode } from 'react'

/**
 * 空状態の共通表示。各ページでバラついていた「まだありません」を統一し、
 * 常に「次の一手」CTA を添えられるようにする。
 */
export function EmptyState({
  icon = '🫧',
  title,
  children,
  action,
  className = 'mt-8',
}: {
  icon?: string
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`card p-10 text-center ${className}`}>
      <div className="text-3xl" aria-hidden>{icon}</div>
      <p className="mt-2 text-base" style={{ fontWeight: 700 }}>{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          {children}
        </p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
