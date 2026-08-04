import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getCurrentUser } from '@/lib/auth'
import {
  getShopById,
  getMyMembership,
  getFlavorsWithUsage,
  getShopFlavorIds,
  getShopMembers,
  getPendingMembers,
} from '@/lib/queries'
import { ShopFlavorChip } from '@/components/shop-flavor-chip'
import { MemberActions } from '@/components/member-actions'
import { TransferOwnerButton } from '@/components/transfer-owner-button'
import { VerifiedBadge } from '@/components/verified-badge'
import { ShopEditForm } from './shop-edit-form'
import { SITE_URL } from '@/lib/site'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'お店の管理 — MixHub' }

type FlavorWithCount = Flavor & { count: number }

export default async function ShopManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/shop/${id}/manage`)

  const shop = await getShopById(id)
  if (!shop) notFound()

  const membership = await getMyMembership(shop.id)
  if (membership?.status !== 'approved') redirect(`/shop/${shop.id}`)
  const isOwner = membership.role === 'owner'

  const [flavors, stockIds, members, pending] = await Promise.all([
    getFlavorsWithUsage(),
    getShopFlavorIds(shop.id),
    getShopMembers(shop.id),
    isOwner ? getPendingMembers(shop.id) : Promise.resolve([]),
  ])
  const stockCount = stockIds.size

  const menuUrl = `${SITE_URL}/shop/${shop.id}`
  const qrSvg = await QRCode.toString(menuUrl, {
    type: 'svg',
    margin: 1,
    color: { dark: '#1f2a26', light: '#ffffff' },
  })

  const byBrand = new Map<string, FlavorWithCount[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      <Link href={`/shop/${shop.id}`} className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← お店のページ</Link>
      <p className="eyebrow mt-4">Shop management</p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl" style={{ fontWeight: 800 }}>
        <span aria-hidden>🏠</span> {shop.name}
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        在庫棚を更新すれば、店頭QRメニューにそのまま反映されます。{isOwner ? 'オーナー権限で店舗情報・スタッフ承認もできます。' : '（在庫の編集ができます）'}
      </p>

      {/* ---------- 店頭QR ---------- */}
      <section className="card mt-8 flex flex-col items-center gap-4 p-6 sm:flex-row sm:gap-6">
        <div
          className="shrink-0 rounded-xl bg-white p-3"
          style={{ width: 160, height: 160 }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-base" style={{ fontWeight: 700 }}>店頭メニューQR</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
            印刷してテーブルに置けば、お客さんがスマホで今日の在庫メニューを見られます。
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link href={`/shop/${shop.id}`} className="btn btn-ember text-sm">メニューを確認</Link>
            <a
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
              download={`mixhub-menu-qr-${shop.id}.svg`}
              className="btn btn-ghost text-sm"
            >
              QRを保存
            </a>
          </div>
          <p className="mt-2 break-all text-xs" style={{ color: 'var(--color-ash-dim)' }}>{menuUrl}</p>
        </div>
      </section>

      {/* ---------- オーナー：参加申請の承認 ---------- */}
      {isOwner && pending.length > 0 && (
        <section className="card mt-8 p-6">
          <h2 className="text-base" style={{ fontWeight: 700 }}>🕓 参加申請（{pending.length}）</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>このお店で働くスタッフか確認して承認してください。</p>
          <ul className="mt-3 flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <Link href={m.user?.username ? `/u/${m.user.username}` : '#'} className="truncate text-sm" style={{ fontWeight: 600 }}>
                    {m.user?.display_name || (m.user?.username ? `@${m.user.username}` : '申請者')}
                  </Link>
                  {m.user?.is_pro && <VerifiedBadge size={13} />}
                </div>
                <MemberActions shopId={shop.id} userId={m.user_id} mode="pending" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- スタッフ一覧（オーナーは譲渡・除名可） ---------- */}
      <section className="card mt-8 p-6">
        <h2 className="text-base" style={{ fontWeight: 700 }}>所属スタッフ（{members.length}）</h2>
        {isOwner && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            承認・在庫編集の管理権限はオーナー1人だけが持ちます。本来のオーナーが加わったら「👑 オーナーを譲渡」で引き継げます。
          </p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex min-w-0 items-center gap-1.5">
                {m.role === 'owner' && <span aria-hidden title="オーナー">👑</span>}
                <Link href={m.user?.username ? `/u/${m.user.username}` : '#'} className="truncate text-sm" style={{ fontWeight: 600 }}>
                  {m.user?.display_name || (m.user?.username ? `@${m.user.username}` : 'スタッフ')}
                </Link>
                {m.role === 'owner' && <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>オーナー</span>}
                {m.user?.is_pro && <VerifiedBadge size={13} />}
              </div>
              {isOwner && m.role !== 'owner' && (
                <div className="flex items-center gap-3">
                  <TransferOwnerButton
                    shopId={shop.id}
                    userId={m.user_id}
                    name={m.user?.display_name || (m.user?.username ? `@${m.user.username}` : 'このスタッフ')}
                  />
                  <MemberActions shopId={shop.id} userId={m.user_id} mode="staff" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 在庫編集 ---------- */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>在庫にあるフレーバー</h2>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{stockCount} 種を在庫中</span>
        </div>
        {flavors.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
            まだフレーバーが登録されていません。
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {brands.map((brand) => (
              <div key={brand}>
                <h3 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>{brand}</h3>
                <div className="flex flex-wrap gap-2">
                  {byBrand.get(brand)!.map((f) => (
                    <ShopFlavorChip key={f.id} shopId={shop.id} flavorId={f.id} label={f.name} initialInStock={stockIds.has(f.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- オーナー：店舗情報の編集 ---------- */}
      {isOwner && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg" style={{ fontWeight: 700 }}>店舗情報</h2>
          <div className="card p-6">
            <ShopEditForm shop={shop} />
          </div>
        </section>
      )}
    </div>
  )
}
