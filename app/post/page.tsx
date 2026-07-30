import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getComboBySlug } from '@/lib/queries'
import { MixForm, type MixFormInitial } from '@/components/mix-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ミックスを投稿 — MixHub' }

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ combo?: string }>
}) {
  const [{ combo: comboSlug }, user] = await Promise.all([searchParams, getCurrentUser()])
  if (!user) redirect('/post')

  // Combo ページからの導線：フレーバーを引き継いで「作り方」を追加
  let initial: MixFormInitial | undefined
  let comboLine: string | undefined
  if (comboSlug) {
    const combo = await getComboBySlug(comboSlug)
    if (combo) {
      comboLine = combo.flavorNames.join(' × ')
      initial = {
        title: '',
        description: '',
        strength: null,
        tasteTags: '',
        heat: '',
        placement: '',
        flavors: (combo.methods[0].mix_flavors ?? []).map((f) => ({
          name: f.name,
          brand: f.brand ?? '',
          ratio: '',
          url: f.affiliate_url ?? '',
        })),
      }
    }
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Post a mix</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>
        {comboLine ? 'この組み合わせで作り方を投稿' : 'ミックスを投稿'}
      </h1>
      {comboLine ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          <b>{comboLine}</b> の、あなたの作り方を追加します。割合や熱の入れ方・置き方で“あなたの一杯”を。
        </p>
      ) : (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          あなたの一杯を図鑑に。いいねが集まれば人気ミックスとしてみんなの参考になります。
        </p>
      )}
      <MixForm mode="create" initial={initial} />
    </div>
  )
}
