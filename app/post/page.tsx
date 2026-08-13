import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getComboBySlug, getFlavors, getMixById } from '@/lib/queries'
import { MixForm, type MixFormInitial } from '@/components/mix-form'
import { mixHeading } from '@/lib/mix'
import { SimpleMixForm } from '@/components/simple-mix-form'
import { ModeToggle } from '@/components/mode-toggle'
import { resolveMode } from '@/lib/mode'
import type { MixWithRelations } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ミックスを投稿 — 煙道' }

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
  if (!user) redirect('/login?next=/post')

  let initial: MixFormInitial | undefined
  let heading = 'ミックスを投稿'
  let lead = 'あなたのミックスを図鑑に。いいねが集まれば人気ミックスとしてみんなの参考になります。'

  // ① 既存の作り方をベースにアレンジ投稿
  if (from) {
    const base = await getMixById(from)
    if (base) {
      heading = 'この作り方をベースに投稿'
      lead = `「${mixHeading(base)}」をベースにしています。自分好みに調整して投稿しましょう。`
      initial = {
        title: base.title,
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
        packPhotoUrl: '',
        photos: [],
        placement: base.placement_note ?? '',
        gearStem: base.gear_stem ?? '',
        gearBowlName: base.gear_bowl_name ?? '',
        gearHmsName: base.gear_hms_name ?? '',
        gearCharcoal: base.gear_charcoal ?? '',
        baseLiquid: base.base_liquid ?? '',
        prepNote: base.prep_note ?? '',
        ratioReason: base.ratio_reason ?? '',
        serveNote: base.serve_note ?? '',
        premium: false,
        price: '',
        lockedSections: [],
        hiddenSections: base.hidden_sections ?? [],
        unlockAt: null,
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
        packPhotoUrl: '',
        photos: [],
        placement: '',
        gearStem: '',
        gearBowlName: '',
        gearHmsName: '',
        gearCharcoal: '',
        baseLiquid: '',
        prepNote: '',
        ratioReason: '',
        serveNote: '',
        premium: false,
        price: '',
        lockedSections: [],
        hiddenSections: [],
        unlockAt: null,
        flavors: mapFlavors(combo.methods[0], false),
      }
    }
  }

  const mode = resolveMode(user.profile)

  // 初心者モード：かんたん投稿（熱管理・器具などは出さない）
  if (mode === 'simple') {
    const initialFlavorIds = (initial?.flavors ?? [])
      .map((f) => f.flavorId)
      .filter((id): id is string => !!id)
    return (
      <div className="wrap max-w-2xl py-10">
        <p className="eyebrow">かんたん投稿</p>
        <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>ミックスを投稿</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          フレーバーの組み合わせと味わいだけで、かんたんに投稿できます。
        </p>
        <SimpleMixForm flavors={flavors} initialFlavorIds={initialFlavorIds} />
        <div className="mt-8 rounded-xl border border-dashed p-4 text-center" style={{ borderColor: 'var(--line-strong)' }}>
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            熱管理カーブ・炭・蒸らし・器具まで細かく記録したい方は
          </p>
          <div className="mt-2">
            <ModeToggle target="pro" label="🛠 プロモードに切り替えて投稿" className="btn btn-ghost text-sm" />
          </div>
        </div>
      </div>
    )
  }

  // プロモード：フル投稿
  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Post a mix</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{heading}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>{lead}</p>
      <MixForm
        mode="create"
        initial={initial}
        flavors={flavors}
        canAddFlavor={!!user.profile?.is_pro || !!user.profile?.is_founder || !!user.profile?.is_admin}
        canSell={!!user.profile?.is_pro || !!user.profile?.is_admin}
      />
      <div className="mt-8 text-center">
        <ModeToggle target="simple" label="🔰 かんたん投稿に切り替える" className="text-xs underline underline-offset-2" />
      </div>
    </div>
  )
}
