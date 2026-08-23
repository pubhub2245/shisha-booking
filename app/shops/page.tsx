import Link from 'next/link'
import { getShopsWithCounts } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: '店舗一覧',
  description: '煙道 に登録しているシーシャ店の一覧。お店の在庫と、そこで試せる作り方をチェックしよう。',
}

export default async function ShopsPage() {
  const [shops, user] = await Promise.all([getShopsWithCounts(), getCurrentUser()])

  return (
    <div className="wrap max-w-3xl py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Shops</p>
          <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>店舗一覧</h1>
        </div>
        {user && <Link href="/shop/new" className="btn btn-ember shrink-0 text-sm">＋ お店を登録</Link>}
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        煙道 に登録しているシーシャ店。お店の在庫メニューから「今そこで吸える一台」を見つけよう。
      </p>

      {shops.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {shops.map((s) => (
            <Link key={s.id} href={`/shop/${s.id}`} className="card card-hover p-5">
              <h2 className="truncate text-lg" style={{ fontWeight: 700 }}>{s.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                {s.area && <span>{s.area}</span>}
                <span>在庫 {s.flavor_count}種</span>
                <span>スタッフ {s.member_count}</span>
              </div>
              {s.description && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {s.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg" style={{ fontWeight: 700 }}>まだ登録店舗がありません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            シーシャ店で働く方は、無料でお店を登録できます。
          </p>
          <Link href={user ? '/shop/new' : '/for-shops'} className="btn btn-ember mt-5">
            {user ? 'お店を登録する' : '店舗の方へ'}
          </Link>
        </div>
      )}
    </div>
  )
}
