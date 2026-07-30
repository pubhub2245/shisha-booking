import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

const items = [
  { href: '/', icon: '📖', label: '図鑑' },
  { href: '/flavors', icon: '🍃', label: 'フレーバー' },
  { href: '/post', icon: '➕', label: '投稿' },
  { href: '/ranking', icon: '🏆', label: '人気' },
]

export async function MobileNav() {
  const user = await getCurrentUser()
  const last = user
    ? { href: '/mypage', icon: '👤', label: 'マイ' }
    : { href: '/login', icon: '👤', label: 'ログイン' }
  const all = [...items, last]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
      style={{ borderColor: 'var(--line)', background: 'rgb(247 244 238 / 0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-stretch justify-around">
        {all.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem]"
            style={{ color: 'var(--color-ash)' }}
          >
            <span className="text-lg leading-none" aria-hidden>{it.icon}</span>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
