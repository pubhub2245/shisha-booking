import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** 旧 URL の互換。正は /method/[id]/edit。 */
export default async function MixEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/method/${id}/edit`)
}
