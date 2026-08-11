'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FlavorState = { ok?: string; error?: string } | null

/** 信頼できる貢献者か（プロ認証・創設メンバー・管理者）。 */
async function isTrusted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ trusted: boolean; isAdmin: boolean }> {
  const { data } = await supabase.from('profiles').select('is_pro, is_founder, is_admin').eq('id', userId).maybeSingle()
  const p = (data ?? {}) as { is_pro?: boolean; is_founder?: boolean; is_admin?: boolean }
  return { trusted: p.is_pro === true || p.is_founder === true || p.is_admin === true, isAdmin: p.is_admin === true }
}

/** フレーバーを1件、図鑑マスタに追加する。 */
export async function addFlavor(_prev: FlavorState, formData: FormData): Promise<FlavorState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { trusted, isAdmin } = await isTrusted(supabase, user.id)
  if (!trusted) return { error: 'フレーバーの追加は認証プロ・創設メンバーのみ可能です。' }

  const brand = String(formData.get('brand') ?? '').trim().toUpperCase()
  const name = String(formData.get('name') ?? '').trim()
  const affiliate = isAdmin ? String(formData.get('affiliate_url') ?? '').trim() || null : null
  if (!brand) return { error: 'ブランド名を入力してください。' }
  if (!name) return { error: 'フレーバー名を入力してください。' }
  if (brand.length > 60 || name.length > 80) return { error: '文字数が長すぎます。' }

  // 既存チェック（重複防止）
  const { data: existing } = await supabase
    .from('flavors')
    .select('id')
    .eq('brand', brand)
    .eq('name', name)
    .maybeSingle()
  if (existing) return { error: `「${brand} ${name}」はすでに登録されています。` }

  const { error } = await supabase
    .from('flavors')
    .insert({ brand, name, added_by: user.id, affiliate_url: affiliate })
  if (error) return { error: '追加に失敗しました。時間をおいて再度お試しください。' }
  revalidatePath('/flavors')
  return { ok: `「${brand} ${name}」を追加しました。` }
}

/**
 * 複数フレーバーを一括追加（貼り付け）。
 * 1行につき「ブランド, 名前」または「ブランド / 名前」。既存はスキップ。
 */
export async function bulkAddFlavors(_prev: FlavorState, formData: FormData): Promise<FlavorState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { trusted } = await isTrusted(supabase, user.id)
  if (!trusted) return { error: 'フレーバーの追加は認証プロ・創設メンバーのみ可能です。' }

  const raw = String(formData.get('bulk') ?? '')
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 500)
  if (lines.length === 0) return { error: '追加する行を入力してください。' }

  // パース：カンマ / スラッシュ / タブ 区切りに対応
  const parsed: { brand: string; name: string }[] = []
  const seen = new Set<string>()
  for (const line of lines) {
    const parts = line.split(/[,/\t]/).map((s) => s.trim())
    if (parts.length < 2) continue
    const brand = parts[0].toUpperCase().slice(0, 60)
    const name = parts.slice(1).join(' ').trim().slice(0, 80)
    if (!brand || !name) continue
    const key = `${brand}|${name}`
    if (seen.has(key)) continue
    seen.add(key)
    parsed.push({ brand, name })
  }
  if (parsed.length === 0) {
    return { error: '有効な行がありません。「ブランド, 名前」の形式で入力してください。' }
  }

  // 既存を除外
  const brands = [...new Set(parsed.map((p) => p.brand))]
  const { data: existingRows } = await supabase.from('flavors').select('brand, name').in('brand', brands)
  const existingSet = new Set(((existingRows ?? []) as { brand: string; name: string }[]).map((r) => `${r.brand}|${r.name}`))
  const toInsert = parsed.filter((p) => !existingSet.has(`${p.brand}|${p.name}`))

  if (toInsert.length === 0) {
    return { ok: `新規はありませんでした（${parsed.length}件はすべて登録済み）。` }
  }

  const { error } = await supabase
    .from('flavors')
    .insert(toInsert.map((p) => ({ brand: p.brand, name: p.name, added_by: user.id })))
  if (error) return { error: '一括追加に失敗しました。時間をおいて再度お試しください。' }
  revalidatePath('/flavors')
  const skipped = parsed.length - toInsert.length
  return { ok: `${toInsert.length}件を追加しました${skipped > 0 ? `（${skipped}件は登録済みでスキップ）` : ''}。` }
}
