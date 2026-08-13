import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { resolveMode } from '@/lib/mode'
import { ModeToggle } from '@/components/mode-toggle'
import { signOut } from '@/actions/auth'
import { getMyProApplication, getMyShops } from '@/lib/queries'
import { ProfileForm } from '../profile-form'
import { ProApplicationForm } from '../pro-application'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'アカウント設定 — 煙道' }

export default async function ProfileEditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mypage/edit')

  const [proApp, myShops] = await Promise.all([getMyProApplication(), getMyShops()])
  const mode = resolveMode(user.profile)

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href="/mypage" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>← マイページ</Link>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 800 }}>アカウント設定</h1>

      {/* プロフィール編集 */}
      <section className="mt-8">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>プロフィール</h2>
        <ProfileForm profile={user.profile} />
      </section>

      {/* 表示モード */}
      <section className="mt-10">
        <h2 className="text-sm" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>表示の詳しさ</h2>
        <div className="card mt-2 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm" style={{ fontWeight: 700 }}>
              {mode === 'pro' ? '詳細表示' : 'シンプル表示'}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              {mode === 'pro'
                ? '熱管理・器具・蒸らし・ランキングまで最初から全部表示します。'
                : 'まずは王道と味わい中心。詳しい作り方は各ページで「詳しく見る」から開けます。'}
              <br />※腕前ではなく<b>見せる情報量</b>の設定です。
            </p>
          </div>
          {mode === 'pro' ? (
            <ModeToggle target="simple" label="シンプル表示にする" className="btn btn-ghost shrink-0 text-sm" />
          ) : (
            <ModeToggle target="pro" label="詳細表示にする" className="btn btn-ember shrink-0 text-sm" />
          )}
        </div>
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
            <Link href="/admin/pro" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>🛡 プロ認証の審査</Link>
            <Link href="/admin/clicks" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>📊 送客クリック集計</Link>
            <Link href="/admin/reports" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>🛡 通報の管理</Link>
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
