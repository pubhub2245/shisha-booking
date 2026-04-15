'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="px-4 sm:px-6 py-4 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center gap-2">
        <Link href="/" className="text-base sm:text-lg font-bold tracking-tight text-white shrink-0">
          出張シーシャ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/reserve" className="text-gray-200 hover:text-amber-400 transition-colors font-medium">
            予約する
          </Link>
          <Link href="/cancel" className="text-gray-200 hover:text-amber-400 transition-colors font-medium">
            キャンセル
          </Link>
          <Link href="/admin/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            管理者
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors text-2xl leading-none"
        >
          {open ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden mt-3 flex flex-col gap-1 bg-white/5 border border-white/10 rounded-lg p-2">
          <Link
            href="/reserve"
            className="block px-3 py-2 rounded text-gray-100 hover:bg-white/10 hover:text-amber-400 transition-colors font-medium"
          >
            予約する
          </Link>
          <Link
            href="/cancel"
            className="block px-3 py-2 rounded text-gray-100 hover:bg-white/10 hover:text-amber-400 transition-colors font-medium"
          >
            キャンセル
          </Link>
          <Link
            href="/admin/login"
            className="block px-3 py-2 rounded text-xs text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            管理者
          </Link>
        </nav>
      )}
    </header>
  )
}
