'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Strength } from '@/lib/types/database'
import { comboKey } from '@/lib/combo'

export type MixFormState = { error: string } | null

type FlavorInput = {
  brand: string
  name: string
  ratio: number | null
  affiliate_url: string | null
}

/** 投稿フォームから複数フレーバー行をパースする。name[] / brand[] ... の並列配列 */
function parseFlavors(formData: FormData): FlavorInput[] {
  const names = formData.getAll('flavor_name').map((v) => String(v).trim())
  const brands = formData.getAll('flavor_brand').map((v) => String(v).trim())
  const ratios = formData.getAll('flavor_ratio').map((v) => String(v).trim())
  const urls = formData.getAll('flavor_url').map((v) => String(v).trim())

  const out: FlavorInput[] = []
  for (let i = 0; i < names.length; i++) {
    if (!names[i]) continue
    out.push({
      brand: brands[i] || '',
      name: names[i],
      ratio: ratios[i] ? Number(ratios[i]) || null : null,
      affiliate_url: urls[i] || null,
    })
  }
  return out
}

export async function createMix(_prev: MixFormState, formData: FormData): Promise<MixFormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/post')

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const strengthRaw = String(formData.get('strength') ?? '').trim()
  const strength: Strength | null =
    strengthRaw === 'light' || strengthRaw === 'medium' || strengthRaw === 'strong' ? strengthRaw : null
  const heat = String(formData.get('heat_management') ?? '').trim() || null
  const placement = String(formData.get('placement_note') ?? '').trim() || null
  const tasteTags = String(formData.get('taste_tags') ?? '')
    .split(/[,、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)

  const flavors = parseFlavors(formData)

  if (!title) return { error: 'ミックスのタイトルを入力してください。' }
  if (flavors.length < 1) return { error: 'フレーバーを1つ以上追加してください。' }

  const { data: mix, error } = await supabase
    .from('mixes')
    .insert({
      author_id: user.id,
      title,
      description,
      taste_tags: tasteTags,
      strength,
      heat_management: heat,
      placement_note: placement,
      combo_key: comboKey(flavors),
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
  const strengthRaw = String(formData.get('strength') ?? '').trim()
  const strength: Strength | null =
    strengthRaw === 'light' || strengthRaw === 'medium' || strengthRaw === 'strong' ? strengthRaw : null
  const heat = String(formData.get('heat_management') ?? '').trim() || null
  const placement = String(formData.get('placement_note') ?? '').trim() || null
  const tasteTags = String(formData.get('taste_tags') ?? '')
    .split(/[,、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
  return { title, description, strength, heat, placement, tasteTags }
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

  const { title, description, strength, heat, placement, tasteTags } = parseMixFields(formData)
  const flavors = parseFlavors(formData)
  if (!title) return { error: 'ミックスのタイトルを入力してください。' }
  if (flavors.length < 1) return { error: 'フレーバーを1つ以上追加してください。' }

  const { error } = await supabase
    .from('mixes')
    .update({ title, description, taste_tags: tasteTags, strength, heat_management: heat, placement_note: placement, combo_key: comboKey(flavors) })
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
