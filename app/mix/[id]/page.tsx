import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * 旧 URL。煙道が扱う単位は「ミックス」ではなく「作り方（method）」になったので、
 * 正は /method/[id]。既存のリンク・ブックマーク・検索結果を壊さないために残している。
 */
export default async function MixRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/method/${id}`)
}
