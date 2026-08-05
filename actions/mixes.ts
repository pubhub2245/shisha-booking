'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { HeatPoint, HeatEvent } from '@/lib/types/database'
import { comboKey } from '@/lib/combo'
import { normalizePrice, LOCKABLE_SECTIONS } from '@/lib/premium'
import { ALL_TASTE_TAGS } from '@/lib/tags'

/** 味わいタグ（選択式）をマスタに照合してパース */
function parseTasteTags(formData: FormData): string[] {
  return formData
    .getAll('taste_tags')
    .map((v) => String(v))
    .filter((t) => ALL_TASTE_TAGS.includes(t))
    .slice(0, 12)
}

const HEAT_EVENT_TYPES = ['add', 'remove', 'ash', 'rotate', 'other']

export type MixFormState = { error: string } | null

type FlavorInput = {
  flavor_id: string | null
  brand: string
  name: string
  ratio: number | null
  affiliate_url: string | null
}

/** 投稿フォームから複数フレーバー行をパースする（選択式：flavor_id + brand/name の並列配列） */
function parseFlavors(formData: FormData): FlavorInput[] {
  const ids = formData.getAll('flavor_id').map((v) => String(v).trim())
  const names = formData.getAll('flavor_name').map((v) => String(v).trim())
  const brands = formData.getAll('flavor_brand').map((v) => String(v).trim())
  const ratios = formData.getAll('flavor_ratio').map((v) => String(v).trim())
  const urls = formData.getAll('flavor_url').map((v) => String(v).trim())

  const out: FlavorInput[] = []
  for (let i = 0; i < names.length; i++) {
    if (!names[i]) continue
    out.push({
      flavor_id: ids[i] || null,
      brand: brands[i] || '',
      name: names[i],
      ratio: ratios[i] ? Number(ratios[i]) || null : null,
      affiliate_url: urls[i] || null,
    })
  }
  return out
}

/** 熱管理カーブ（JSON）をパースして検証する */
function parseHeatCurve(formData: FormData): HeatPoint[] | null {
  const raw = String(formData.get('heat_curve') ?? '')
  if (!raw) return null
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return null
    const pts = arr
      .filter((p) => p && typeof p.t === 'number' && typeof p.v === 'number')
      .map((p) => {
        const pt: HeatPoint = {
          t: Math.max(0, Math.min(180, Math.round(p.t * 2) / 2)),
          v: Math.max(1, Math.min(100, Math.round(p.v))),
        }
        // キューブ炭の個数（任意・玄人向け）。0-20 の整数のみ。未指定は省略。
        if (typeof p.coals === 'number' && Number.isFinite(p.coals)) {
          const c = Math.max(0, Math.min(20, Math.round(p.coals)))
          if (c > 0) pt.coals = c
        }
        return pt
      })
      .slice(0, 40)
    return pts.length >= 2 ? pts : null
  } catch {
    return null
  }
}

/** 炭イベント（JSON）をパース */
function parseHeatEvents(formData: FormData): HeatEvent[] | null {
  const raw = String(formData.get('heat_events') ?? '')
  if (!raw) return null
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return null
    const evts: HeatEvent[] = arr
      .filter((e) => e && typeof e.t === 'number' && HEAT_EVENT_TYPES.includes(e.type))
      .map((e) => ({
        t: Math.max(0, Math.min(180, Math.round(e.t * 2) / 2)),
        type: e.type as string,
        note: e.note ? String(e.note).slice(0, 120) : undefined,
      }))
      .slice(0, 30)
    return evts.length > 0 ? evts : null
  } catch {
    return null
  }
}

const HMS_VALUES = ['lotus', 'provost', 'turkish', 'steamulation', 'nagrani', 'aot', 'foil', 'other', 'kaloud']
const CHARCOAL_VALUES = ['cube', 'flat', 'ogatan', 'other']
const ORIENTATION_VALUES = ['vertical', 'horizontal']
const BOWL_VALUES = ['clay', 'funnel', 'vortex', 'phunnel', 'silicone', 'other']
const PACK_VALUES = ['fluff', 'layered', 'flat', 'dense', 'overpack', 'other']

/** 炭・熱源・ボウルセットアップをパース */
function parseHeatSetup(formData: FormData) {
  const hmsRaw = String(formData.get('hms_type') ?? '')
  const hmsOther = String(formData.get('hms_other') ?? '').trim().slice(0, 60) || null
  const charRaw = String(formData.get('charcoal_type') ?? '')
  const orientRaw = String(formData.get('charcoal_orientation') ?? '')
  const countRaw = String(formData.get('charcoal_count') ?? '').trim()
  const windRaw = String(formData.get('wind_cover') ?? '')
  const bowlRaw = String(formData.get('bowl_type') ?? '')
  const packRaw = String(formData.get('pack_style') ?? '')
  const count = countRaw ? Math.max(0, Math.min(20, Number(countRaw) || 0)) : null
  const hms_type = HMS_VALUES.includes(hmsRaw) ? hmsRaw : null
  const charcoal_type = CHARCOAL_VALUES.includes(charRaw) ? charRaw : null
  return {
    hms_type,
    hms_other: hms_type === 'other' ? hmsOther : null,
    charcoal_type,
    // 縦置き/横置きはフラット炭のときだけ有効
    charcoal_orientation: charcoal_type === 'flat' && ORIENTATION_VALUES.includes(orientRaw) ? orientRaw : null,
    charcoal_count: count,
    wind_cover: windRaw === 'true' ? true : windRaw === 'false' ? false : null,
    bowl_type: BOWL_VALUES.includes(bowlRaw) ? bowlRaw : null,
    pack_style: PACK_VALUES.includes(packRaw) ? packRaw : null,
  }
}

/** ログインユーザーが管理者か（フレーバー追加・購入リンク設定用） */
async function isAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
  return !!data && (data as { is_admin?: boolean }).is_admin === true
}

/** プロ認証者 or 管理者か（有料ノートの出品用） */
async function isProOrAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('is_pro, is_admin').eq('id', userId).maybeSingle()
  return !!data && ((data as { is_pro?: boolean }).is_pro === true || (data as { is_admin?: boolean }).is_admin === true)
}

/**
 * 新規フレーバー（flavor_id 無し）を図鑑マスタに追加し、id を紐付ける。
 * 追加はプロ認証者（＋管理者）のみ。追加者を added_by に記録する。
 * 非プロが入力した新規フレーバーはマスタ登録されず、その投稿内の自由入力として保存される。
 */
async function growFlavorMaster(
  supabase: Awaited<ReturnType<typeof createClient>>,
  flavors: FlavorInput[],
  userId: string
): Promise<void> {
  const newOnes = flavors.filter((f) => !f.flavor_id && f.name)
  if (newOnes.length === 0) return
  // フレーバー図鑑への追加は管理者のみ
  if (!(await isAdmin(supabase, userId))) return
  try {
    await supabase
      .from('flavors')
      .upsert(
        newOnes.map((f) => ({ brand: f.brand || '', name: f.name, added_by: userId })),
        { onConflict: 'brand,name', ignoreDuplicates: true }
      )
    const { data } = await supabase
      .from('flavors')
      .select('id, brand, name')
      .in('name', newOnes.map((f) => f.name))
    const map = new Map(
      (data ?? []).map((r) => [`${(r.brand as string) ?? ''}|${r.name as string}`, r.id as string])
    )
    for (const f of flavors) {
      if (!f.flavor_id && f.name) f.flavor_id = map.get(`${f.brand || ''}|${f.name}`) ?? null
    }
  } catch (e) {
    console.error('[growFlavorMaster]', e)
  }
}

/** 有料ノート設定を解釈（プロ／管理者のみ有効）。 */
async function parsePremium(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData
): Promise<{ premium: boolean; price: number | null; locked_sections: string[] }> {
  const validSections = LOCKABLE_SECTIONS.map((s) => s.v) as string[]
  const requested = formData.get('premium') === 'on'
  const locked = formData.getAll('locked_sections').map(String).filter((v) => validSections.includes(v))
  if (!requested || locked.length === 0) return { premium: false, price: null, locked_sections: [] }
  // プロ／管理者のみ有料化できる
  if (!(await isProOrAdmin(supabase, userId))) return { premium: false, price: null, locked_sections: [] }
  return { premium: true, price: normalizePrice(formData.get('price')), locked_sections: locked }
}

export async function createMix(_prev: MixFormState, formData: FormData): Promise<MixFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/post')

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const heat = String(formData.get('heat_management') ?? '').trim() || null
  const placement = String(formData.get('placement_note') ?? '').trim() || null
  const tasteTags = parseTasteTags(formData)

  const flavors = parseFlavors(formData)
  const heatCurve = parseHeatCurve(formData)
  const heatEvents = parseHeatEvents(formData)
  const heatSetup = parseHeatSetup(formData)

  if (!title) return { error: 'ミックスのタイトルを入力してください。' }
  if (flavors.length < 1) return { error: 'フレーバーを1つ以上追加してください。' }

  await growFlavorMaster(supabase, flavors, user.id)
  const premiumFields = await parsePremium(supabase, user.id, formData)
  // 購入リンクは管理者のみ設定可
  if (!(await isAdmin(supabase, user.id))) for (const f of flavors) f.affiliate_url = null

  const { data: mix, error } = await supabase
    .from('mixes')
    .insert({
      author_id: user.id,
      title,
      description,
      taste_tags: tasteTags,
      heat_management: heat,
      heat_curve: heatCurve,
      heat_events: heatEvents,
      ...heatSetup,
      placement_note: placement,
      combo_key: comboKey(flavors),
      ...premiumFields,
    })
    .select('id')
    .single()

  if (error || !mix) {
    console.error('[createMix]', error?.message)
    return { error: '投稿に失敗しました。時間をおいて再度お試しください。' }
  }

  const rows = flavors.map((f, i) => ({
    mix_id: mix.id as string,
    position: i,
    flavor_id: f.flavor_id,
    brand: f.brand || null,
    name: f.name,
    ratio: f.ratio,
    affiliate_url: f.affiliate_url,
  }))
  const { error: fErr } = await supabase.from('mix_flavors').insert(rows)
  if (fErr) console.error('[createMix flavors]', fErr.message)

  revalidatePath('/')
  redirect(`/mix/${mix.id}`)
}

function parseMixFields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const heat = String(formData.get('heat_management') ?? '').trim() || null
  const placement = String(formData.get('placement_note') ?? '').trim() || null
  const tasteTags = parseTasteTags(formData)
  return { title, description, heat, placement, tasteTags }
}

export async function updateMix(_prev: MixFormState, formData: FormData): Promise<MixFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const mixId = String(formData.get('mix_id') ?? '')
  if (!mixId) return { error: '対象が不明です。' }

  // 所有者チェック
  const { data: owned } = await supabase.from('mixes').select('author_id').eq('id', mixId).maybeSingle()
  if (!owned || owned.author_id !== user.id) return { error: 'このミックスを編集する権限がありません。' }

  const { title, description, heat, placement, tasteTags } = parseMixFields(formData)
  const flavors = parseFlavors(formData)
  const heatCurve = parseHeatCurve(formData)
  const heatEvents = parseHeatEvents(formData)
  const heatSetup = parseHeatSetup(formData)
  if (!title) return { error: 'ミックスのタイトルを入力してください。' }
  if (flavors.length < 1) return { error: 'フレーバーを1つ以上追加してください。' }

  await growFlavorMaster(supabase, flavors, user.id)
  const premiumFields = await parsePremium(supabase, user.id, formData)
  if (!(await isAdmin(supabase, user.id))) for (const f of flavors) f.affiliate_url = null

  const { error } = await supabase
    .from('mixes')
    .update({ title, description, taste_tags: tasteTags, heat_management: heat, heat_curve: heatCurve, heat_events: heatEvents, ...heatSetup, placement_note: placement, combo_key: comboKey(flavors), ...premiumFields })
    .eq('id', mixId)
  if (error) {
    console.error('[updateMix]', error.message)
    return { error: '更新に失敗しました。時間をおいて再度お試しください。' }
  }

  // フレーバーは総入れ替え
  await supabase.from('mix_flavors').delete().eq('mix_id', mixId)
  const rows = flavors.map((f, i) => ({
    mix_id: mixId,
    position: i,
    flavor_id: f.flavor_id,
    brand: f.brand || null,
    name: f.name,
    ratio: f.ratio,
    affiliate_url: f.affiliate_url,
  }))
  await supabase.from('mix_flavors').insert(rows)

  revalidatePath('/')
  revalidatePath(`/mix/${mixId}`)
  redirect(`/mix/${mixId}`)
}

export async function deleteMix(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const mixId = String(formData.get('mix_id') ?? '')
  if (!mixId) redirect('/mypage')
  await supabase.from('mixes').delete().eq('id', mixId).eq('author_id', user.id)
  revalidatePath('/')
  revalidatePath('/mypage')
  redirect('/mypage')
}

/** いいねのトグル。戻り値で最新状態を返す（楽観的 UI 用）。 */
export async function toggleLike(mixId: string): Promise<{ liked: boolean; count: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const { data: existing } = await supabase
    .from('likes')
    .select('mix_id')
    .eq('mix_id', mixId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked: boolean
  if (existing) {
    await supabase.from('likes').delete().eq('mix_id', mixId).eq('user_id', user.id)
    liked = false
  } else {
    await supabase.from('likes').insert({ mix_id: mixId, user_id: user.id })
    liked = true
  }

  const { data: mix } = await supabase.from('mixes').select('like_count').eq('id', mixId).maybeSingle()
  revalidatePath('/')
  revalidatePath(`/mix/${mixId}`)
  return { liked, count: (mix?.like_count as number) ?? 0 }
}
