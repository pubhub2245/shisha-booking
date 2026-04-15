import Link from 'next/link'

type Props = {
  page: number
  pageSize: number
  total: number
  baseHref: string // e.g. "/admin/customers?q=foo&"
}

export default function Pagination({ page, pageSize, total, baseHref }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const prev = Math.max(1, page - 1)
  const next = Math.min(totalPages, page + 1)
  const sep = baseHref.includes('?') ? '&' : '?'
  const link = (p: number) => `${baseHref}${sep}page=${p}`
  return (
    <nav
      aria-label="ページネーション"
      className="flex items-center justify-between px-6 py-3 text-sm text-gray-700"
    >
      <div>
        全 {total} 件 / {page} / {totalPages} ページ
      </div>
      <div className="flex gap-2">
        <Link
          href={link(prev)}
          aria-disabled={page <= 1}
          className={`px-3 py-1 rounded border ${
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-100'
          }`}
        >
          前へ
        </Link>
        <Link
          href={link(next)}
          aria-disabled={page >= totalPages}
          className={`px-3 py-1 rounded border ${
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-100'
          }`}
        >
          次へ
        </Link>
      </div>
    </nav>
  )
}
