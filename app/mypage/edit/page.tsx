import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { signOut } from '@/actions/auth'
import { getMyProApplication, getMyShops } from '@/lib/queries'
import { ProfileForm } from '../profile-form'
import { ProApplicationForm } from '../pro-application'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'アカウント設定' }

export default async function ProfileEditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mypage/edit')

  const [proApp, myShops] = await Promise.all([getMyProApplication(), getMyShops()])

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 800 }}>アカウント設定</h1>

      {/* プロフィール編集 */}
      <section className="mt-8">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロフィール</h2>
        <ProfileForm profile={user.profile} />
      </section>

      {/* プロ認証 */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロ認証（シーシャ店スタッフ）</h2>
        <ProApplicationForm
          isPro={user.profile?.is_pro ?? false}
          application={proApp}
          shops={myShops.map((s) => ({ id: s.id, name: s.name }))}
        />
      </section>

      {/* 管理者メニュー（管理者のみ表示・閲覧可） */}
      {user.profile?.is_admin && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>管理メニュー</h2>
          <div className="card flex flex-col gap-2 p-4 text-sm">
            <Link href="/admin/pro" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>プロ認証の審査</Link>
            <Link href="/admin/clicks" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>送客クリック集計</Link>
            <Link href="/admin/reports" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>通報の管理</Link>
            <Link href="/admin/orthodoxy" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>王道の認定</Link>
          </div>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            これらは管理者だけが閲覧できます。
          </p>
        </section>
      )}

      {/* ログアウト */}
      <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
        <form action={signOut}>
          <button type="submit" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
