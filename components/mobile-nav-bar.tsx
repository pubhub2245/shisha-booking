'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; icon: string; label: string }

/** 下部ナビの本体（現在地ハイライト付き）。isAuthed はサーバー側から渡す。 */
export function MobileNavBar({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname()
  const items: Item[] = [
    { href: '/', icon: '📖', label: '図鑑' },
    { href: '/national', icon: '🇯🇵', label: '日本代表' },
    { href: '/post', icon: '➕', label: '投稿' },
    { href: '/search', icon: '🔍', label: '検索' },
    isAuthed ? { href: '/mypage', icon: '👤', label: 'マイ' } : { href: '/login', icon: '👤', label: 'ログイン' },
  ]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
      style={{ borderColor: 'var(--line)', background: 'var(--surface-blur-strong)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-stretch justify-around">
        {items.map((it) => {
          const active = isActive(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] transition-colors"
              style={{ color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)', fontWeight: active ? 700 : 400 }}
            >
              <span className="text-lg leading-none" aria-hidden>{it.icon}</span>
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
