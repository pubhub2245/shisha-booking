import Link from 'next/link'
import { ReactNode } from 'react'

type NavKey = 'reservations' | 'customers' | 'staff' | 'bars' | 'flavors'

export default function AdminShell({
  active,
  userEmail,
  children,
}: {
  active: NavKey
  userEmail?: string | null
  children: ReactNode
}) {
  const items: { key: NavKey; label: string; href: string }[] = [
    { key: 'reservations', label: '予約一覧', href: '/admin' },
    { key: 'customers', label: '顧客一覧', href: '/admin/customers' },
    { key: 'staff', label: 'スタッフ管理', href: '/admin/staff' },
    { key: 'bars', label: 'バー管理', href: '/admin/bars' },
    { key: 'flavors', label: 'フレーバー管理', href: '/admin/flavors' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
          <div className="flex items-center gap-4">
            {userEmail && <span className="text-sm text-gray-500 hidden sm:inline">{userEmail}</span>}
            <form action="/api/signout" method="post">
              <button className="text-sm text-red-500 hover:text-red-700">ログアウト</button>
            </form>
          </div>
        </div>
        <nav className="px-6 border-t border-gray-100 flex gap-1 overflow-x-auto">
          {items.map(it => (
            <Link
              key={it.key}
              href={it.href}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                active === it.key
                  ? 'text-amber-600 border-amber-500'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
