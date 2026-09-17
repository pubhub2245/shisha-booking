import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFlavorIndex } from '@/lib/flavor-index-data'
import { flavorsOfType, TASTE_TYPES, MIN_ITEMS } from '@/lib/flavor-index'
import { FlavorIndexList } from '@/components/flavor-index-list'
import { Breadcrumb } from '@/components/breadcrumb'
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/json-ld'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const name = decodeURIComponent(type)
  return {
    title: `${name}系のシーシャフレーバー`,
    description: `${name}系のシーシャフレーバーと、その作り方。実際に作られた作り方が付いているものだけを、実績の多い順に並べています。`,
  }
}

export default async function TasteTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const name = decodeURIComponent(type)
  if (!TASTE_TYPES.includes(name)) notFound()

  const index = await getFlavorIndex()
  const items = flavorsOfType(index, name)
  // 薄いページを作らない：実データが MIN_ITEMS 件そろっていない系統はページにしない
  if (items.length < MIN_ITEMS) notFound()

  const crumbs = [
    { name: '煙道', url: SITE_URL },
    { name: '味の系統から探す', url: `${SITE_URL}/taste` },
    { name: `${name}系`, url: `${SITE_URL}/taste/${encodeURIComponent(name)}` },
  ]

  return (
    <div className="wrap max-w-3xl py-10">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          `${name}系のシーシャフレーバー`,
          items.map((f) => ({ name: `${f.brand} ${f.name}`, url: `${SITE_URL}/flavor/${f.id}` })),
        )}
      />
      <Breadcrumb
        items={[{ name: '煙道', href: '/' }, { name: '味の系統から探す', href: '/taste' }, { name: `${name}系` }]}
      />

      <p className="eyebrow mt-4">Taste</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{name}系のフレーバー</h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
        {items.length}種。作り方に「{name}」と付いたものだけを数えています。
        上にあるほど、実際に作った人が多いフレーバーです。
      </p>

      <FlavorIndexList items={items} />

      <p className="mt-10 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        <Link href="/taste" style={{ color: 'var(--color-ash-dim)' }}>ほかの系統を見る</Link>
        <span aria-hidden="true"> ／ </span>
        <Link href="/flavors" style={{ color: 'var(--color-ash-dim)' }}>フレーバー図鑑（全件）</Link>
      </p>
    </div>
  )
}
