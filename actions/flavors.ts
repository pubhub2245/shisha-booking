'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FlavorState = { ok?: string; error?: string } | null

// ---- フレーバー名の整形（自動取り込み用） ----
const NOISE: RegExp[] = [
  /水たばこ/gi, /水タバコ/gi, /シーシャ/gi, /フレーバー/gi, /たばこ/gi,
  /\d+\s?(g|kg|ｇ)/gi,
  /【[^】]*】/g, /\([^)]*\)/g, /（[^）]*）/g,
]
const SKIP_HANDLES = new Set([
  'all', 'frontpage', 'sale', 'new', 'new-arrivals', 'featured', 'best', 'bestseller',
  'ranking', 'set', 'sets', 'accessory', 'accessories', 'charcoal', 'goods', 'other',
  'coming-soon', 'sold-out', 'campaign',
])

function handleToBrand(handle: string): string {
  return handle.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}
function looksLikeBrand(handle: string): boolean {
  if (SKIP_HANDLES.has(handle)) return false
  if (handle.length < 2) return false
  return /[a-z0-9]/i.test(handle)
}
function cleanTitle(title: string, brand: string): string {
  let s = String(title)
  const variants = [brand, brand.toLowerCase(), brand.replace(/\s+/g, ''), brand.replace(/\s+/g, '-')]
  for (const b of variants) {
    if (!b) continue
    s = s.replace(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
  }
  for (const re of NOISE) s = s.replace(re, ' ')
  s = s.replace(/[|｜/／]/g, ' ').replace(/\s+/g, ' ').trim()
  s = s.replace(/^[-–—・,、\s]+|[-–—・,、\s]+$/g, '').trim()
  return s
}

async function getJson(url: string, timeoutMs = 6000): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Endoh-flavor-importer' }, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

/**
 * ショップURL（Shopify製シーシャ通販）から全ブランドのフレーバーを取り込む。
 * サーバー（Vercel）側で取得するので、ユーザーはボタンを押すだけ。管理者専用。
 */
export async function importFlavorsFromShop(shopUrlRaw: string): Promise<FlavorState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!(prof as { is_admin?: boolean } | null)?.is_admin) return { error: 'この機能は管理者のみ利用できます。' }

  let shop = (shopUrlRaw || '').trim().replace(/\/+$/, '')
  if (!shop) return { error: 'ショップのURLを入力してください。' }
  if (!/^https?:\/\//i.test(shop)) shop = `https://${shop}`
  try {
    new URL(shop)
  } catch {
    return { error: 'URLの形式が正しくありません。' }
  }

  // 1) コレクション（≒ブランド）一覧
  let collections: { handle: string }[]
  try {
    const json = (await getJson(`${shop}/collections.json?limit=250`)) as { collections?: { handle: string }[] }
    collections = (json.collections ?? []).filter((c) => looksLikeBrand(c.handle))
  } catch (e) {
    return { error: `ショップ情報を取得できませんでした（${(e as Error).message}）。Shopify製の通販URLか確認してください。` }
  }
  if (collections.length === 0) return { error: 'ブランドのコレクションが見つかりませんでした。' }

  // 2) 各ブランドの商品名を並列取得（タイムアウト対策で最大40ブランド）
  const targets = collections.slice(0, 40)
  const results = await Promise.all(
    targets.map(async (c) => {
      const brand = handleToBrand(c.handle)
      try {
        const json = (await getJson(`${shop}/collections/${c.handle}/products.json?limit=250`)) as {
          products?: { title: string }[]
        }
        const rows = (json.products ?? [])
          .map((p) => cleanTitle(p.title, brand))
          .filter((name) => name && name.length <= 80)
          .map((name) => ({ brand, name }))
        return rows
      } catch {
        return []
      }
    })
  )

  // 3) 重複除去（バッチ内）
  const seen = new Set<string>()
  const parsed: { brand: string; name: string }[] = []
  for (const rows of results) {
    for (const r of rows) {
      const key = `${r.brand}|${r.name}`
      if (seen.has(key)) continue
      seen.add(key)
      parsed.push(r)
    }
  }
  if (parsed.length === 0) return { error: '取り込めるフレーバーがありませんでした。' }

  // 4) 既存を除外
  const brands = [...new Set(parsed.map((p) => p.brand))]
  const { data: existingRows } = await supabase.from('flavors').select('brand, name').in('brand', brands)
  const existing = new Set(((existingRows ?? []) as { brand: string; name: string }[]).map((r) => `${r.brand}|${r.name}`))
  const toInsert = parsed.filter((p) => !existing.has(`${p.brand}|${p.name}`)).slice(0, 2000)

  if (toInsert.length === 0) {
    return { ok: `新規はありませんでした（${parsed.length}件はすべて登録済み）。` }
  }

  const { error } = await supabase
    .from('flavors')
    .insert(toInsert.map((p) => ({ brand: p.brand, name: p.name, added_by: user.id })))
  if (error) return { error: '登録に失敗しました。時間をおいて再度お試しください。' }

  revalidatePath('/flavors')
  const skipped = parsed.length - toInsert.length
  return {
    ok: `${brands.length}ブランドから ${toInsert.length}件を追加しました${skipped > 0 ? `（${skipped}件は登録済み）` : ''}。`,
  }
}

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
