import { getCurrentUser } from '@/lib/auth'
import { MobileNavBar } from '@/components/mobile-nav-bar'

/** サーバー側でログイン状態だけ判定し、表示は client の MobileNavBar に委譲。 */
export async function MobileNav() {
  const user = await getCurrentUser()
  return <MobileNavBar isAuthed={!!user} />
}
