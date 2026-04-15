import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="px-4 sm:px-6 py-4 flex justify-between items-center max-w-5xl mx-auto w-full gap-2">
      <Link href="/" className="text-base sm:text-lg font-bold tracking-tight text-white shrink-0">
        出張シーシャ
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5 text-sm">
        <Link href="/reserve" className="text-gray-200 hover:text-amber-400 transition-colors font-medium">
          予約する
        </Link>
        <Link href="/cancel" className="text-gray-200 hover:text-amber-400 transition-colors font-medium">
          キャンセル
        </Link>
        <Link
          href="/admin/login"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          管理者
        </Link>
      </nav>
    </header>
  )
}
