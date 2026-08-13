import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getShopById,
  getShopFlavors,
  getShopMenuCombos,
  getShopMembers,
  getMyMembership,
  getShopInventoryUpdatedAt,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { relativeTime, isOlderThanDays } from '@/lib/time'
import { ComboCard } from '@/components/combo-card'
import { VerifiedBadge } from '@/components/verified-badge'
import { Avatar } from '@/components/avatar'
import { ShopJoinButton } from '@/components/shop-join-button'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const shop = await getShopById(id)
  if (!shop) return { title: 'お店が見つかりません — 煙道' }
  return {
    title: `${shop.name} のメニュー — 煙道`,
    description: `${shop.name} で今吸えるフレーバーと、作れるミックスの一覧。`,
  }
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shop = await getShopById(id)
  if (!shop) notFound()

  const [flavors, combos, members, membership, me, invUpdatedAt] = await Promise.all([
    getShopFlavors(shop.id),
    getShopMenuCombos(shop.id),
    getShopMembers(shop.id),
    getMyMembership(shop.id),
    getCurrentUser(),
    getShopInventoryUpdatedAt(shop.id),
  ])
  const isApproved = membership?.status === 'approved'
  const joinState = membership ? membership.status : 'none'
  // 在庫の鮮度（30日以上更新なしは要注意表示）
  const invStale = isOlderThanDays(invUpdatedAt, 30)

  const byBrand = new Map<string, Flavor[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      {/* ---------- SHOP HEADER ---------- */}
      <div className="card p-6 fade-up">
        <div className="flex items-start gap-3">
          <Avatar name={shop.name} seed={shop.id} size={52} />
          <div className="min-w-0 flex-1">
            <span className="chip chip-active mb-2 inline-flex">🏠 店頭メニュー</span>
            <h1 className="truncate text-2xl" style={{ fontWeight: 800 }}>{shop.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
              {(shop.area || shop.prefecture) && (
                <span>📍 {[shop.prefecture, shop.area].filter(Boolean).join('・')}</span>
              )}
              {shop.url && (
                <a href={shop.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ember-hot)' }}>
                  お店のリンク →
                </a>
              )}
            </div>
          </div>
          {isApproved && (
            <Link href={`/shop/${shop.id}/manage`} className="btn btn-ghost shrink-0 text-sm">在庫を編集</Link>
          )}
        </div>

        {shop.description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{shop.description}</p>
        )}

        {/* 所属スタッフ */}
        {members.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>スタッフ</span>
            {members.map((m) => (
              <Link
                key={m.user_id}
                href={m.user?.username ? `/u/${m.user.username}` : '#'}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash)' }}
              >
                {m.role === 'owner' && <span aria-hidden title="オーナー">👑</span>}
                <span>{m.user?.display_name || (m.user?.username ? `@${m.user.username}` : 'スタッフ')}</span>
                {m.user?.is_pro && <VerifiedBadge size={12} />}
              </Link>
            ))}
          </div>
        )}

        {/* 参加申請（自分がまだ所属していない場合） */}
        {!isApproved && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <ShopJoinButton shopId={shop.id} initialState={joinState} isAuthed={!!me} />
            {joinState === 'none' && (
              <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                このお店で働いている方は、参加申請するとオーナーの承認後に所属スタッフになれます。
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------- 来店者向け：実地評価の案内 ---------- */}
      {shop.lat != null && shop.lng != null && (
        <div
          className="mt-4 rounded-xl border p-4 text-sm"
          style={{ borderColor: 'rgb(178 59 46 / 0.30)', background: 'rgb(178 59 46 / 0.05)' }}
        >
          <div className="flex items-center gap-2" style={{ fontWeight: 800 }}>📍 ご来店ありがとうございます</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
            スタッフのミックスを実際に吸ったら、そのミックスのページで <b>「実地評価」</b> を押してください。
            現地のGPSで確認された一票は、いいねより重く<b>日本代表の選出</b>に効きます。
          </p>
        </div>
      )}

      {flavors.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>メニューは準備中です</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            このお店はまだ在庫フレーバーを登録していません。
          </p>
          {isApproved && <Link href={`/shop/${shop.id}/manage`} className="btn btn-ember mt-5">在庫を登録する</Link>}
        </div>
      ) : (
        <>
          <section className="mt-8">
            <p className="mb-3 text-sm" style={{ color: 'var(--color-ash)' }}>
              この中から好きなフレーバーを選んでください。タップで詳細・作れるミックスが見られます。
            </p>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg" style={{ fontWeight: 700 }}>🍃 今あるフレーバー（{flavors.length}）</h2>
              {invUpdatedAt && (
                <span
                  className="rounded-full px-2 py-0.5 text-[0.68rem]"
                  style={
                    invStale
                      ? { background: 'rgb(213 153 43 / 0.14)', color: '#b7791f', fontWeight: 700 }
                      : { color: 'var(--color-ash-dim)' }
                  }
                  title="在庫が最後に更新された時期の目安です"
                >
                  {invStale ? '⚠️ ' : '🕒 '}在庫更新 {relativeTime(invUpdatedAt)}
                  {invStale && '（古い可能性）'}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-5">
              {brands.map((brand) => (
                <div key={brand}>
                  <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>{brand}</h3>
                  <div className="flex flex-wrap gap-2">
                    {byBrand.get(brand)!.map((f) => (
                      <Link key={f.id} href={`/flavor/${f.id}`} className="chip">{f.name}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {combos.length > 0 && (
            <section className="mt-12">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg" style={{ fontWeight: 700 }}>🔥 このお店で作れるミックス（{combos.length}）</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {combos.slice(0, 12).map((combo) => (
                  <ComboCard key={combo.key} combo={combo} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
