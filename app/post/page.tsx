import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getFlavors, getFlavorById, getMixById } from '@/lib/queries'
import { MixForm, type MixFormInitial } from '@/components/mix-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: '作り方を登録 — 煙道' }

/** 何も指定が無いときの初期値。フレーバーだけ差し替えて使う。 */
const EMPTY: MixFormInitial = {
  title: null,
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
  charcoalSizeMm: '',
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
  flavors: [],
}

/**
 * 作り方の登録。
 *
 * 煙道が扱うのは「1つのフレーバーを、どう作るか」なので、ここで選ぶフレーバーは1つ。
 * かつては「かんたん投稿／詳しく投稿」の2択を置いていたが、あれは
 * 「フレーバーの組み合わせ」が投稿の主役だった頃の設計。いま主役は作り方そのものなので、
 * 入口を分けず1つのフォームにして、フレーバー以外はすべて任意にしている。
 */
export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string; from?: string }>
}) {
  const [{ flavor: flavorId, from }, user, flavors] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getFlavors(),
  ])
  if (!user) redirect('/login?next=/post')

  let initial: MixFormInitial | undefined
  let heading = '作り方を登録する'
  let lead = 'フレーバーを1つ選んで、どう作るかを残します。フレーバー以外はすべて任意です。'

  // ① 既存の作り方をベースにする（同じフレーバーで、どこかを変えた一台）
  if (from) {
    const base = await getMixById(from)
    if (base) {
      heading = 'この作り方をベースに登録'
      lead = 'ベースから変えたところだけ直してください。何を変えたかが、そのまま比較の材料になります。'
      initial = {
        ...EMPTY,
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
        charcoalSizeMm: base.charcoal_size_mm != null ? String(base.charcoal_size_mm) : '',
        steepMinutes: base.steep_minutes != null ? String(base.steep_minutes) : '',
        steepHeat: base.steep_heat != null ? String(base.steep_heat) : '',
        windCover: base.wind_cover === true ? 'true' : base.wind_cover === false ? 'false' : '',
        bowlType: base.bowl_type ?? '',
        packStyle: base.pack_style ?? '',
        placement: base.placement_note ?? '',
        gearStem: base.gear_stem ?? '',
        gearBowlName: base.gear_bowl_name ?? '',
        gearHmsName: base.gear_hms_name ?? '',
        gearCharcoal: base.gear_charcoal ?? '',
        baseLiquid: base.base_liquid ?? '',
        prepNote: base.prep_note ?? '',
        ratioReason: base.ratio_reason ?? '',
        serveNote: base.serve_note ?? '',
        hiddenSections: base.hidden_sections ?? [],
        // 作り方に紐づくフレーバーは1つ。ベースの1つ目だけを引き継ぐ
        flavors: (base.mix_flavors ?? []).slice(0, 1).map((f) => ({
          flavorId: f.flavor_id ?? '',
          name: f.name,
          brand: f.brand ?? '',
          ratio: '',
          url: f.affiliate_url ?? '',
        })),
      }
    }
  }

  // ② フレーバーのページからの導線
  if (!initial && flavorId) {
    const f = await getFlavorById(flavorId)
    if (f) {
      heading = `${f.name} の作り方を登録`
      lead = `${f.brand} ${f.name} を、あなたがどう作っているか。フレーバー以外はすべて任意です。`
      initial = {
        ...EMPTY,
        flavors: [{ flavorId: f.id, name: f.name, brand: f.brand, ratio: '', url: f.affiliate_url ?? '' }],
      }
    }
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Method</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>{heading}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>{lead}</p>
      <MixForm
        mode="create"
        initial={initial}
        flavors={flavors}
        canAddFlavor={!!user.profile?.is_pro || !!user.profile?.is_founder || !!user.profile?.is_admin}
        canSell={!!user.profile?.is_pro || !!user.profile?.is_admin}
      />
      <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        「作った」「吸った」は体験の記録です。作り方のページから残せます。
      </p>
      <div className="mt-2 text-center">
        <Link href="/" className="text-xs underline underline-offset-2" style={{ color: 'var(--color-ash-dim)' }}>
          フレーバーを選びなおす
        </Link>
      </div>
    </div>
  )
}
