import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getComboBySlug, getFlavors, getMixById, getCombos } from '@/lib/queries'
import { MixForm, type MixFormInitial } from '@/components/mix-form'
import { mixHeading } from '@/lib/mix'
import { SimpleMixForm } from '@/components/simple-mix-form'
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
  searchParams: Promise<{ combo?: string; from?: string; form?: string }>
}) {
  const [{ combo: comboSlug, from, form }, user, flavors, allCombos] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getFlavors(),
    // 「この組み合わせには既に◯通りの作り方があります」を出すための件数表
    getCombos({}),
  ])
  const comboCounts: Record<string, number> = {}
  for (const c of allCombos) comboCounts[c.key] = c.methodCount
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

  // 投稿の深さは「表示モード（シンプル/詳細）」ではなく、その都度ユーザーが選ぶ。
  // 既定の初期選択だけ表示モードから推測する（初心者/プロでサイトを分断しない）。
  const mode = resolveMode(user.profile)
  const suggested = mode === 'pro' ? 'detail' : 'simple'
  const chosen = form === 'simple' || form === 'detail' ? form : null
  const keep = (extra: string) => {
    const p = new URLSearchParams()
    if (comboSlug) p.set('combo', comboSlug)
    if (from) p.set('from', from)
    p.set('form', extra)
    return `/post?${p.toString()}`
  }

  // ① 入口：何をすればよいか分かる2択（専門用語を最初から並べない）
  if (!chosen) {
    return (
      <div className="wrap max-w-2xl py-10">
        <p className="eyebrow">Post a mix</p>
        <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>作り方を投稿する</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          同じ組み合わせでも、作り方は人それぞれ。あなたの一台を図鑑に残しましょう。
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href={keep('simple')} className="card card-hover flex flex-col gap-2 p-6">
            <h2 className="text-lg" style={{ fontWeight: 800 }}>かんたんに投稿</h2>
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              フレーバーと配合を中心に、短時間で共有する。
            </p>
            <span className="mt-1 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              この方法で投稿する →
            </span>
            {suggested === 'simple' && (
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>おすすめ</span>
            )}
          </Link>
          <Link href={keep('detail')} className="card card-hover flex flex-col gap-2 p-6">
            <h2 className="text-lg" style={{ fontWeight: 800 }}>詳しく投稿</h2>
            <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
              器具・盛り方・炭・熱管理まで残して、再現できるようにする。
            </p>
            <span className="mt-1 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              この方法で投稿する →
            </span>
            {suggested === 'detail' && (
              <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>おすすめ</span>
            )}
          </Link>
        </div>
        <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 「吸った」「作ってみた」は<b>体験の記録</b>で、ミックス詳細から残せます。ここは<b>作り方の共有</b>です。
        </p>
      </div>
    )
  }

  if (chosen === 'simple') {
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
        <SimpleMixForm flavors={flavors} initialFlavorIds={initialFlavorIds} comboCounts={comboCounts} />
        <div className="mt-8 rounded-xl border border-dashed p-4 text-center" style={{ borderColor: 'var(--line-strong)' }}>
          <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
            熱管理カーブ・炭・蒸らし・器具まで細かく記録したい方は
          </p>
          <div className="mt-2">
            <Link href={keep('detail')} className="btn btn-ghost text-sm">こだわって投稿する（詳しい作り方も記録）</Link>
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
        <Link href={keep('simple')} className="text-xs underline underline-offset-2" style={{ color: 'var(--color-ash-dim)' }}>
          かんたん投稿に切り替える
        </Link>
      </div>
    </div>
  )
}
