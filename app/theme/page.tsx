import { redirect, notFound } from 'next/navigation'
import { getFlavorsWithMethods } from '@/lib/queries'
import { flavorKey } from '@/lib/combo'
import { FIRST_THEME } from '@/lib/theme'

export const dynamic = 'force-dynamic'

/**
 * 「今月の煙道検証」。テーマは combo ではなくフレーバー1つを指すので、
 * 実体はそのフレーバーのページ。ここは名前つきの入口として残しているだけ。
 */
export default async function ThemeRedirect() {
  const flavors = await getFlavorsWithMethods()
  const hit = flavors.find((f) => flavorKey(f.flavor.brand, f.flavor.name) === FIRST_THEME.comboKey)
  if (!hit) notFound()
  redirect(`/flavor/${hit.flavor.id}`)
}
