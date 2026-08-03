import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFlavorById, getMixesUsingFlavor, getLikedMixIds, getMyShelfFlavorIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { ShelfButton } from '@/components/shelf-button'
import { withAffiliateTag } from '@/lib/affiliate'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const flavor = await getFlavorById(id)
  if (!flavor) return { title: 'フレーバーが見つかりません — MixHub' }
  return {
    title: `${flavor.brand} ${flavor.name} を使ったミックス — MixHub`,
    description: `${flavor.brand} ${flavor.name} を使ったシーシャのミックス一覧。`,
  }
}

export default async function FlavorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const flavor = await getFlavorById(id)
  if (!flavor) notFound()

  const [mixes, likedIds, user, shelfIds] = await Promise.all([
    getMixesUsingFlavor(flavor),
    getLikedMixIds(),
    getCurrentUser(),
    getMyShelfFlavorIds(),
  ])
  const buyUrl = withAffiliateTag(flavor.affiliate_url)

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        ← フレーバー図鑑
      </Link>

      <div className="card mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</div>
          <h1 className="text-2xl" style={{ fontWeight: 800 }}>{flavor.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShelfButton
            flavorId={flavor.id}
            initialOwned={shelfIds.has(flavor.id)}
            isAuthed={!!user}
            nextPath={`/flavor/${flavor.id}`}
          />
          {buyUrl && (
            <a href={buyUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ember">
              このフレーバーを購入する
            </a>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg" style={{ fontWeight: 700 }}>
        このフレーバーを使ったミックス（{mixes.length}）
      </h2>
      {mixes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {mixes.map((m) => (
            <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            まだこのフレーバーを使ったミックスがありません。
          </p>
          <Link href="/post" className="btn btn-ember mt-4">＋ 最初のミックスを投稿</Link>
        </div>
      )}
      {buyUrl && (
        <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 購入リンクにはアフィリエイトを含む場合があります。
        </p>
      )}
    </div>
  )
}
