import Link from 'next/link'
import type { Metadata } from 'next'
import { getFlavorIndex } from '@/lib/flavor-index-data'
import { publishableTypes, MIN_ITEMS } from '@/lib/flavor-index'
import { Breadcrumb } from '@/components/breadcrumb'
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/json-ld'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '味の系統から探す',
  description: 'ミント系・フルーツ系など、味の系統からシーシャのフレーバーを探す。実際に作られた作り方が付いているものだけを載せています。',
}

export default async function TasteIndexPage() {
  const index = await getFlavorIndex()
  const types = publishableTypes(index)

  const crumbs = [
    { name: '煙道', url: SITE_URL },
    { name: '味の系統から探す', url: `${SITE_URL}/taste` },
  ]

  return (
    <div className="wrap max-w-3xl py-10">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          '味の系統',
          types.map((t) => ({ name: `${t.type}系`, url: `${SITE_URL}/taste/${encodeURIComponent(t.type)}` })),
        )}
      />
      <Breadcrumb items={[{ name: '煙道', href: '/' }, { name: '味の系統から探す' }]} />

      <p className="eyebrow mt-4">Taste</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>味の系統から探す</h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
        系統は、実際に投稿された作り方に付いている言葉だけから数えています。
        フレーバー名からの推測はしません。{MIN_ITEMS}件そろっていない系統は出しません。
      </p>

      {types.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          まだ系統をまとめられるだけの作り方がありません。作り方が増えると、ここに系統が並びます。
        </p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {types.map((t) => (
            <li key={t.type}>
              <Link
                href={`/taste/${encodeURIComponent(t.type)}`}
                className="flex min-h-11 items-center justify-between rounded-xl border px-4 py-3"
                style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)' }}
              >
                <span className="text-sm" style={{ color: 'var(--color-cream)', fontWeight: 600 }}>{t.type}系</span>
                <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{t.count}種</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        <Link href="/flavors" style={{ color: 'var(--color-ash-dim)' }}>フレーバー図鑑（全件）</Link>
      </p>
    </div>
  )
}
