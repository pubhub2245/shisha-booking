import { redirect, notFound } from 'next/navigation'
import { getComboBySlug } from '@/lib/queries'

export const dynamic = 'force-dynamic'

/**
 * 旧 combo（フレーバーの組み合わせ）ページ。
 *
 * 煙道は「1つのフレーバーを、どう作るか」だけを扱うようになったので、組み合わせという単位は
 * 表から消えた。既存のリンク・ブックマークを壊さないよう、その作り方のフレーバーページへ送る。
 */
export default async function ComboRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const combo = await getComboBySlug(slug)
  if (!combo || combo.methods.length === 0) notFound()
  const flavorId = (combo.methods[0].mix_flavors ?? [])[0]?.flavor_id
  redirect(flavorId ? `/flavor/${flavorId}` : `/mix/${combo.methods[0].id}`)
}
