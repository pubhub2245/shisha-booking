import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { ShopNewForm } from './shop-new-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'お店を登録' }

export default async function ShopNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/shop/new')

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/shops" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← 店舗一覧</Link>
      <p className="eyebrow mt-4">Register a shop</p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl" style={{ fontWeight: 800 }}>お店を登録
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        働いているお店を登録して、在庫棚・店頭QRメニューを使いましょう。あなたの個人アカウントに紐づきます。
      </p>
      <ShopNewForm />
    </div>
  )
}
