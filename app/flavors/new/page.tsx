import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { getFlavors } from '@/lib/queries'
import { FlavorAddForms } from '@/components/flavor-add-forms'
import { FlavorImport } from '@/components/flavor-import'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'フレーバーを図鑑に追加 — MixHub' }

export default async function AddFlavorPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/flavors/new')

  const isTrusted = !!user.profile?.is_pro || !!user.profile?.is_founder || !!user.profile?.is_admin
  const isAdmin = !!user.profile?.is_admin

  if (!isTrusted) {
    return (
      <div className="wrap max-w-2xl py-10">
        <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← フレーバー図鑑</Link>
        <div className="card mt-6 p-8 text-center">
          <p className="text-base" style={{ fontWeight: 700 }}>フレーバー追加は認証プロ・創設メンバー限定です</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            図鑑の正確さを保つため、追加は信頼できる作り手のみが行えます。
          </p>
          <Link href="/founders" className="btn btn-ember mt-5 text-sm">創設メンバーについて</Link>
        </div>
      </div>
    )
  }

  const flavors = await getFlavors()
  const brands = [...new Set(flavors.map((f) => f.brand))].sort()

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← フレーバー図鑑</Link>
      <p className="eyebrow mt-3">Add flavors</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>フレーバーを図鑑に追加</h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        実際に使うフレーバーを図鑑に登録できます。正確な情報でお願いします（現在 {flavors.length} 種）。
      </p>

      {isAdmin && (
        <div className="mt-6">
          <FlavorImport />
        </div>
      )}

      <FlavorAddForms isAdmin={isAdmin} brands={brands} />
    </div>
  )
}
