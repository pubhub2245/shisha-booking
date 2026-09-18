import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFlavorById } from '@/lib/queries'
import { getFlavorIndex } from '@/lib/flavor-index-data'
import { similarFlavors, MIN_ITEMS } from '@/lib/flavor-index'
import { FlavorIndexList } from '@/components/flavor-index-list'
import { Breadcrumb } from '@/components/breadcrumb'
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/json-ld'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const flavor = await getFlavorById(id)
  if (!flavor) return { title: 'フレーバーが見つかりません' }
  return {
    title: `${flavor.brand} ${flavor.name} に似た味のフレーバー`,
    description: `${flavor.brand} ${flavor.name} と同じ系統のシーシャフレーバー。実際に作られた作り方が付いているものだけを並べています。`,
  }
}

/**
 * 「〇〇に似た味」＝同じ系統の言葉が付いたフレーバー。
 * 似ているかどうかは、作り方に人が付けた言葉だけで決める。煙道が味を判定はしない。
 */
export default async function SimilarFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [flavor, index] = await Promise.all([getFlavorById(id), getFlavorIndex()])
  if (!flavor) notFound()

  const items = similarFlavors(index, id)
  // 薄いページを作らない：似た味が MIN_ITEMS 件そろわないフレーバーはページにしない
  if (items.length < MIN_ITEMS) notFound()

  const base = index.find((f) => f.id === id)
  const title = `${flavor.brand} ${flavor.name}`
  const crumbs = [
    { name: '煙道', url: SITE_URL },
    { name: 'フレーバー図鑑', url: `${SITE_URL}/flavors` },
    { name: title, url: `${SITE_URL}/flavor/${id}` },
    { name: '似た味', url: `${SITE_URL}/flavor/${id}/similar` },
  ]

  return (
    <div className="wrap max-w-3xl py-10">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={itemListJsonLd(
          `${title} に似た味のフレーバー`,
          items.map((f) => ({ name: `${f.brand} ${f.name}`, url: `${SITE_URL}/flavor/${f.id}` })),
        )}
      />
      <Breadcrumb
        items={[
          { name: '煙道', href: '/' },
          { name: 'フレーバー図鑑', href: '/flavors' },
          { name: title, href: `/flavor/${id}` },
          { name: '似た味' },
        ]}
      />

      <p className="eyebrow mt-4">Similar</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{title} に似た味</h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-ash)' }}>
        {base && base.tags.length > 0 ? `${base.tags.join('・')} ` : ''}
        の系統が重なるフレーバー {items.length}種。
        系統は、作り方に人が付けた言葉から数えています（煙道が味を決めてはいません）。
      </p>

      <FlavorIndexList items={items} />

      <p className="mt-10 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        <Link href={`/flavor/${id}`} style={{ color: 'var(--color-ash-dim)' }}>{title} の作り方にもどる</Link>
        <span aria-hidden="true"> ／ </span>
        <Link href="/taste" style={{ color: 'var(--color-ash-dim)' }}>味の系統から探す</Link>
      </p>
    </div>
  )
}
