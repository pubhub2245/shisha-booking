import Link from 'next/link'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { getCurrentUser } from '@/lib/auth'
import { getFlavorsWithUsage, getShopFlavorIds } from '@/lib/queries'
import { ShopFlavorChip } from '@/components/shop-flavor-chip'
import { SITE_URL } from '@/lib/site'
import type { Flavor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'
export const metadata = { title: '在庫棚の管理 — MixHub' }

type FlavorWithCount = Flavor & { count: number }

export default async function ShopInventoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/shop/inventory')
  if (!user.profile?.is_shop) redirect('/for-shops')

  const username = user.profile.username
  const [flavors, stockIds] = await Promise.all([getFlavorsWithUsage(), getShopFlavorIds(user.id)])
  const stockCount = stockIds.size

  const menuUrl = username ? `${SITE_URL}/s/${username}` : null
  const qrSvg = menuUrl
    ? await QRCode.toString(menuUrl, { type: 'svg', margin: 1, color: { dark: '#1f2a26', light: '#ffffff' } })
    : null

  // ブランド別
  const byBrand = new Map<string, FlavorWithCount[]>()
  for (const f of flavors) {
    const arr = byBrand.get(f.brand) ?? []
    arr.push(f)
    byBrand.set(f.brand, arr)
  }
  const brands = [...byBrand.keys()].sort()

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Shop inventory</p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl" style={{ fontWeight: 800 }}>
        <span aria-hidden>🏠</span> 在庫棚の管理
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        今ある（吸える）フレーバーを選ぶだけ。お客さんは店頭QRから<b>メニュー表</b>として見られ、
        アプリ上では「このフレーバーがあるお店」として来店のきっかけになります。
        <b>更新すれば、そのまま在庫の反映</b>になります。
      </p>

      {/* ---------- 店頭QR & メニューリンク ---------- */}
      {menuUrl && qrSvg ? (
        <section className="card mt-8 flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
          <div
            className="qr-print shrink-0 rounded-xl bg-white p-3"
            style={{ width: 160, height: 160 }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-base" style={{ fontWeight: 700 }}>店頭メニューQR</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
              このQRを印刷してテーブルに置けば、お客さんがスマホで今日のメニュー（在庫）を見られます。
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Link href={`/s/${username}`} className="btn btn-ember text-sm">メニューを確認</Link>
              <a
                href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
                download={`mixhub-menu-qr-${username}.svg`}
                className="btn btn-ghost text-sm"
              >
                QRを保存
              </a>
            </div>
            <p className="mt-2 break-all text-xs" style={{ color: 'var(--color-ash-dim)' }}>{menuUrl}</p>
          </div>
        </section>
      ) : (
        <div className="card mt-8 p-6 text-sm" style={{ color: 'var(--color-ash)' }}>
          店頭QRを発行するには、
          <Link href="/mypage" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>マイページ</Link>
          でユーザー名（@）を設定してください。
        </div>
      )}

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
                    <ShopFlavorChip
                      key={f.id}
                      flavorId={f.id}
                      label={f.name}
                      initialInStock={stockIds.has(f.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
