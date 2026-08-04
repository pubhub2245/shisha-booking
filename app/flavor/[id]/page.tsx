import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getFlavorById,
  getMixesUsingFlavor,
  getLikedMixIds,
  getMyShelfFlavorIds,
  getShopsWithFlavor,
  getFlavorAdder,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { ShelfButton } from '@/components/shelf-button'
import { VerifiedBadge } from '@/components/verified-badge'
import { goHref } from '@/lib/go'

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

  const [mixes, likedIds, user, shelfIds, shops, adder] = await Promise.all([
    getMixesUsingFlavor(flavor),
    getLikedMixIds(),
    getCurrentUser(),
    getMyShelfFlavorIds(),
    getShopsWithFlavor(flavor),
    flavor.added_by ? getFlavorAdder(flavor.added_by) : Promise.resolve(null),
  ])
  const buyUrl = goHref(flavor.affiliate_url, { f: flavor.id })

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/flavors" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        ← フレーバー図鑑
      </Link>

      <div className="card mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{flavor.brand}</div>
          <h1 className="text-2xl" style={{ fontWeight: 800 }}>{flavor.name}</h1>
          <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            <span>追加:</span>
            {adder ? (
              <Link
                href={adder.username ? `/u/${adder.username}` : '#'}
                className="inline-flex items-center gap-1"
                style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
              >
                {adder.display_name || (adder.username ? `@${adder.username}` : 'ユーザー')}
                {adder.is_pro && <VerifiedBadge size={11} />}
              </Link>
            ) : (
              <span>MixHub 編集部</span>
            )}
          </div>
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

      {/* ---------- 取り扱い店舗（来店誘導） ---------- */}
      {shops.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>
            🏠 このフレーバーがあるお店（{shops.length}）
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {shops.map((s) => (
              <Link key={s.id} href={`/shop/${s.id}`} className="card card-hover flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <span className="block truncate text-sm" style={{ fontWeight: 700 }}>{s.name}</span>
                  {s.area && (
                    <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>📍 {s.area}</div>
                  )}
                </div>
                <span className="shrink-0 text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>メニュー →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
