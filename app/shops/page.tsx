import Link from 'next/link'
import { getShops } from '@/lib/queries'
import { VerifiedBadge } from '@/components/verified-badge'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '店舗一覧 — MixHub',
  description: 'MixHub に登録しているシーシャ店の一覧。お店のミックスをチェックしよう。',
}

export default async function ShopsPage() {
  const shops = await getShops()

  return (
    <div className="wrap max-w-3xl py-10">
      <p className="eyebrow">Shops</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>店舗一覧</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        MixHub に登録しているシーシャ店。お店のミックスから「行きたい一台」を見つけよう。
      </p>

      {shops.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {shops.map((s) => (
            <Link key={s.id} href={`/u/${s.username}`} className="card card-hover p-5">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg" style={{ fontWeight: 700 }}>
                  {s.shop_name || s.display_name || `@${s.username}`}
                </h2>
                {s.is_pro && <VerifiedBadge size={15} />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                {s.shop_area && <span>📍 {s.shop_area}</span>}
                <span>ミックス {s.mix_count}件</span>
              </div>
              {s.bio && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {s.bio}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>まだ登録店舗がありません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            シーシャ店の方は、無料で店舗登録できます。
          </p>
          <Link href="/for-shops" className="btn btn-ember mt-5">店舗の方へ</Link>
        </div>
      )}
    </div>
  )
}
