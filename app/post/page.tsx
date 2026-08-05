import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getComboBySlug, getFlavors, getMixById } from '@/lib/queries'
import { MixForm, type MixFormInitial } from '@/components/mix-form'
import type { MixWithRelations } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ミックスを投稿 — MixHub' }

function mapFlavors(mix: MixWithRelations, keepRatioUrl: boolean) {
  return (mix.mix_flavors ?? []).map((f) => ({
    flavorId: f.flavor_id ?? '',
    name: f.name,
    brand: f.brand ?? '',
    ratio: keepRatioUrl && f.ratio != null ? String(f.ratio) : '',
    url: f.affiliate_url ?? '',
  }))
}

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ combo?: string; from?: string }>
}) {
  const [{ combo: comboSlug, from }, user, flavors] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getFlavors(),
  ])
  if (!user) redirect('/post')

  let initial: MixFormInitial | undefined
  let heading = 'ミックスを投稿'
  let lead = 'あなたのミックスを図鑑に。いいねが集まれば人気ミックスとしてみんなの参考になります。'

  // ① 既存の作り方をベースにアレンジ投稿
  if (from) {
    const base = await getMixById(from)
    if (base) {
      heading = 'この作り方をベースに投稿'
      lead = `「${base.title}」をベースにしています。自分好みに調整して投稿しましょう。`
      initial = {
        title: `${base.title}（アレンジ）`,
        description: base.description ?? '',
        tasteTags: base.taste_tags ?? [],
        heat: base.heat_management ?? '',
        heatCurve: base.heat_curve,
        heatEvents: base.heat_events,
        hmsType: base.hms_type ?? '',
        hmsOther: base.hms_other ?? '',
        charcoalType: base.charcoal_type ?? '',
        charcoalOrientation: base.charcoal_orientation ?? '',
        charcoalCount: base.charcoal_count != null ? String(base.charcoal_count) : '',
        steepMinutes: base.steep_minutes != null ? String(base.steep_minutes) : '',
        steepHeat: base.steep_heat != null ? String(base.steep_heat) : '',
        windCover: base.wind_cover === true ? 'true' : base.wind_cover === false ? 'false' : '',
        bowlType: base.bowl_type ?? '',
        packStyle: base.pack_style ?? '',
        placement: base.placement_note ?? '',
        premium: false,
        price: '',
        lockedSections: [],
        flavors: mapFlavors(base, true),
      }
    }
  }

  // ② Combo ページからの導線：フレーバーを引き継いで「作り方」を追加
  if (!initial && comboSlug) {
    const combo = await getComboBySlug(comboSlug)
    if (combo) {
      heading = 'この組み合わせで作り方を投稿'
      lead = `${combo.flavorNames.join(' × ')} の、あなたの作り方を追加します。割合や熱の入れ方・置き方で“あなたの一台”を。`
      initial = {
        title: '',
        description: '',
        tasteTags: [],
        heat: '',
        heatCurve: null,
        heatEvents: null,
        hmsType: '',
        hmsOther: '',
        charcoalType: '',
        charcoalOrientation: '',
        charcoalCount: '',
        steepMinutes: '',
        steepHeat: '',
        windCover: '',
        bowlType: '',
        packStyle: '',
        placement: '',
        premium: false,
        price: '',
        lockedSections: [],
        flavors: mapFlavors(combo.methods[0], false),
      }
    }
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Post a mix</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{heading}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>{lead}</p>
      <MixForm
        mode="create"
        initial={initial}
        flavors={flavors}
        canAddFlavor={!!user.profile?.is_admin}
        canSell={!!user.profile?.is_pro || !!user.profile?.is_admin}
      />
    </div>
  )
}
