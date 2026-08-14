import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { comboKey, comboSlug, comboKeyFromSlug, flavorKey } from '@/lib/combo'
import { mixQuality, mixCompleteness } from '@/lib/quality'
import { searchVariants } from '@/lib/kana'
import { TYPE_TAGS } from '@/lib/tags'
import { REGIONS, regionOf, REGION_EMOJI, type RegionKey } from '@/lib/regions'
import { mixSupportScore, shopSupportScore, openRankValue } from '@/lib/score'
import { isActivelyLocked, isFullyOpen } from '@/lib/lock'
import type {
  MixWithRelations,
  Mix,
  MixFlavor,
  MixAuthor,
  CommentNode,
  Comment,
  Profile,
  Flavor,
  ProApplication,
  ProApplicationWithUser,
  ComboSummary,
  NearMakeable,
  Shop,
  ShopMember,
  ShopMemberRole,
  ShopMemberStatus,
  ShopWithCounts,
  ShopMemberWithUser,
  MyMembership,
  Notification,
  NotificationWithContext,
  Report,
  FlavorLog,
  FlavorLogWithAuthor,
  MakanaiLog,
  Idea,
  IdeaWithVotes,
  IdeaComment,
  IdeaCommentWithAuthor,
  IdeaArbitration,
  NationalRep,
  MixName,
  MixNameWithVotes,
  OnsiteContext,
  ShopRankItem,
  RegionMix,
  RegionRanking,
} from '@/lib/types/database'

export type FeedOptions = {
  sort?: 'new' | 'popular' | 'detailed'
  tags?: string[]
  strength?: 'light' | 'medium' | 'strong'
  q?: string
  makeableOnly?: boolean
}

/** マイ棚に入れている flavor_id 集合（UIのトグル状態用） */
export async function getMyShelfFlavorIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Set()
    const { data } = await supabase.from('shelf').select('flavor_id').eq('user_id', user.id)
    return new Set((data ?? []).map((r) => r.flavor_id as string))
  } catch {
    return new Set()
  }
}

/** 所持フレーバーの正規化キー集合（brand|name）— 作れる判定用 */
export async function getOwnedFlavorKeys(): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Set()
    const { data: sh } = await supabase.from('shelf').select('flavor_id').eq('user_id', user.id)
    const ids = (sh ?? []).map((r) => r.flavor_id as string)
    if (ids.length === 0) return new Set()
    const { data: fl } = await supabase.from('flavors').select('brand, name').in('id', ids)
    return new Set((fl ?? []).map((f) => flavorKey(f.brand as string, f.name as string)))
  } catch {
    return new Set()
  }
}

// ---------- お店（shops / shop_members） ----------

export async function getShopById(id: string): Promise<Shop | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('shops').select('*').eq('id', id).maybeSingle()
    return (data as Shop) ?? null
  } catch {
    return null
  }
}

/** お店一覧（在庫数・所属人数つき）。ディレクトリ用。 */
export async function getShopsWithCounts(): Promise<ShopWithCounts[]> {
  try {
    const supabase = await createClient()
    const { data: shops } = await supabase.from('shops').select('*').order('created_at', { ascending: false })
    const list = (shops ?? []) as Shop[]
    if (list.length === 0) return []
    const ids = list.map((s) => s.id)
    const [{ data: fl }, { data: mem }] = await Promise.all([
      supabase.from('shop_flavors').select('shop_id').in('shop_id', ids),
      supabase.from('shop_members').select('shop_id, status').in('shop_id', ids).eq('status', 'approved'),
    ])
    const fCount = new Map<string, number>()
    for (const r of fl ?? []) fCount.set(r.shop_id as string, (fCount.get(r.shop_id as string) ?? 0) + 1)
    const mCount = new Map<string, number>()
    for (const r of mem ?? []) mCount.set(r.shop_id as string, (mCount.get(r.shop_id as string) ?? 0) + 1)
    return list.map((s) => ({ ...s, flavor_count: fCount.get(s.id) ?? 0, member_count: mCount.get(s.id) ?? 0 }))
  } catch {
    return []
  }
}

/** 指定ユーザーが「承認済みで所属」しているお店（＋自分の役割） */
export async function getShopsByMember(userId: string): Promise<(Shop & { role: ShopMemberRole })[]> {
  try {
    const supabase = await createClient()
    const { data: mem } = await supabase
      .from('shop_members')
      .select('shop_id, role')
      .eq('user_id', userId)
      .eq('status', 'approved')
    const rows = (mem ?? []) as { shop_id: string; role: ShopMemberRole }[]
    if (rows.length === 0) return []
    const { data: shops } = await supabase.from('shops').select('*').in('id', rows.map((r) => r.shop_id))
    const roleById = new Map(rows.map((r) => [r.shop_id, r.role]))
    return ((shops ?? []) as Shop[]).map((s) => ({ ...s, role: roleById.get(s.id) ?? 'staff' }))
  } catch {
    return []
  }
}

/** ログイン中ユーザーが所属（承認済み）のお店 */
export async function getMyShops(): Promise<(Shop & { role: ShopMemberRole })[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    return getShopsByMember(user.id)
  } catch {
    return []
  }
}

/** ログイン中ユーザーの、あるお店への所属状態 */
export async function getMyMembership(shopId: string): Promise<MyMembership> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('shop_members')
      .select('role, status')
      .eq('shop_id', shopId)
      .eq('user_id', user.id)
      .maybeSingle()
    return (data as MyMembership) ?? null
  } catch {
    return null
  }
}

async function membersByStatus(shopId: string, status: ShopMemberStatus): Promise<ShopMemberWithUser[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('shop_members')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', status)
      .order('created_at', { ascending: true })
    const rows = (data ?? []) as ShopMember[]
    if (rows.length === 0) return []
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_shop, is_pro, shop_name')
      .in('id', userIds)
    const byId = new Map<string, MixAuthor>()
    for (const u of (users ?? []) as MixAuthor[]) byId.set(u.id, u)
    return rows.map((r) => ({ ...r, user: byId.get(r.user_id) ?? null }))
  } catch {
    return []
  }
}

/** 承認済みの所属スタッフ（オーナーを先頭に） */
export async function getShopMembers(shopId: string): Promise<ShopMemberWithUser[]> {
  const members = await membersByStatus(shopId, 'approved')
  return members.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))
}

/** 参加申請中（オーナーの承認待ち） */
export async function getPendingMembers(shopId: string): Promise<ShopMemberWithUser[]> {
  return membersByStatus(shopId, 'pending')
}

// ---------- 店舗の在庫棚（shop_flavors） ----------

/** 店の在庫に入っている flavor_id 集合（在庫編集UIのトグル状態用） */
export async function getShopFlavorIds(shopId: string): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('shop_flavors').select('flavor_id').eq('shop_id', shopId)
    return new Set((data ?? []).map((r) => r.flavor_id as string))
  } catch {
    return new Set()
  }
}

/** 店の在庫フレーバー（メニュー表示用の実データ） */
export async function getShopFlavors(shopId: string): Promise<Flavor[]> {
  try {
    const supabase = await createClient()
    const { data: sf } = await supabase.from('shop_flavors').select('flavor_id').eq('shop_id', shopId)
    const ids = (sf ?? []).map((r) => r.flavor_id as string)
    if (ids.length === 0) return []
    const { data } = await supabase.from('flavors').select('*').in('id', ids).order('brand').order('name')
    return (data ?? []) as Flavor[]
  } catch {
    return []
  }
}

/** 店に共有された賄いシーシャの練習記録（オーナー／承認スタッフ閲覧用）。 */
export async function getShopMakanaiLogs(shopId: string): Promise<MakanaiLog[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('flavor_logs')
      .select('*')
      .eq('shop_id', shopId)
      .order('logged_at', { ascending: false })
      .limit(200)
    const logs = (data ?? []) as FlavorLog[]
    if (logs.length === 0) return []
    const userIds = [...new Set(logs.map((l) => l.user_id))]
    const flavorIds = [...new Set(logs.map((l) => l.flavor_id))]
    const [authorsRes, flavorsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', userIds),
      supabase.from('flavors').select('id, brand, name').in('id', flavorIds),
    ])
    const amap = new Map((authorsRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    const fmap = new Map(
      (flavorsRes.data ?? []).map((f) => {
        const r = f as { id: string; brand: string; name: string }
        return [r.id, { brand: r.brand, name: r.name }]
      })
    )
    return logs.map((l) => ({ ...l, author: amap.get(l.user_id) ?? null, flavor: fmap.get(l.flavor_id) ?? null }))
  } catch {
    return []
  }
}

/** 店の在庫が最後に更新（追加）された日時。鮮度表示用。無ければ null。 */
export async function getShopInventoryUpdatedAt(shopId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('shop_flavors')
      .select('created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as { created_at: string } | null)?.created_at ?? null
  } catch {
    return null
  }
}

/** 店の在庫フレーバーの正規化キー集合（brand|name）— 作れる判定用 */
export async function getShopOwnedFlavorKeys(shopId: string): Promise<Set<string>> {
  const flavors = await getShopFlavors(shopId)
  return new Set(flavors.map((f) => flavorKey(f.brand, f.name)))
}

/** 店の在庫だけで作れるミックス（店頭メニュー用） */
export async function getShopMenuCombos(shopId: string): Promise<ComboSummary[]> {
  const owned = await getShopOwnedFlavorKeys(shopId)
  if (owned.size === 0) return []
  const mixes = await getMixes({})
  return buildCombos(mixes, { sort: 'detailed' }, owned)
}

/** そのフレーバーを在庫に持つお店一覧（来店誘導用） */
export async function getShopsWithFlavor(flavor: Flavor): Promise<Shop[]> {
  try {
    const supabase = await createClient()
    // flavor_id 一致、または同じ brand+name の別 flavor_id も拾う
    const { data: sameFlavors } = await supabase
      .from('flavors')
      .select('id')
      .eq('brand', flavor.brand)
      .eq('name', flavor.name)
    const flavorIds = [...new Set([flavor.id, ...((sameFlavors ?? []).map((f) => f.id as string))])]
    const { data: sf } = await supabase.from('shop_flavors').select('shop_id').in('flavor_id', flavorIds)
    const shopIds = [...new Set((sf ?? []).map((r) => r.shop_id as string))]
    if (shopIds.length === 0) return []
    const { data: shops } = await supabase.from('shops').select('*').in('id', shopIds)
    return (shops ?? []) as Shop[]
  } catch {
    return []
  }
}

/**
 * mixes 行に mix_flavors / author を手動で結合する。
 * PostgREST の埋め込み（author:profiles(...) 等）はスキーマキャッシュに依存して
 * 不安定なため、単純な select を複数回投げて結合する堅牢な実装にしている。
 */
export async function attachRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mixes: Mix[]
): Promise<MixWithRelations[]> {
  if (mixes.length === 0) return []
  const mixIds = mixes.map((m) => m.id)
  const authorIds = [...new Set(mixes.map((m) => m.author_id).filter((v): v is string => !!v))]

  const [{ data: flavors }, authorsRes] = await Promise.all([
    supabase.from('mix_flavors').select('*').in('mix_id', mixIds),
    authorIds.length
      ? supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', authorIds)
      : Promise.resolve({ data: [] as MixAuthor[] }),
  ])

  const flavorsByMix = new Map<string, MixFlavor[]>()
  for (const f of (flavors ?? []) as MixFlavor[]) {
    const arr = flavorsByMix.get(f.mix_id) ?? []
    arr.push(f)
    flavorsByMix.set(f.mix_id, arr)
  }
  const authorById = new Map<string, MixAuthor>()
  for (const a of (authorsRes.data ?? []) as MixAuthor[]) authorById.set(a.id, a)

  return mixes.map((m) => ({
    ...m,
    author: m.author_id ? authorById.get(m.author_id) ?? null : null,
    mix_flavors: (flavorsByMix.get(m.id) ?? []).sort((a, b) => a.position - b.position),
  }))
}

/** 図鑑フィード。DB 未接続・エラー時は空配列で穏当に返す。 */
export async function getMixes(opts: FeedOptions = {}): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    let query = supabase.from('mixes').select('*').eq('hidden', false)

    // 複数タグは AND（すべて含む）
    if (opts.tags && opts.tags.length) query = query.contains('taste_tags', opts.tags)
    if (opts.strength) query = query.eq('strength', opts.strength)
    if (opts.q && opts.q.trim()) {
      // PostgREST の or() 構文を壊す文字を除去
      const term = opts.q.trim().replace(/[(),]/g, ' ').trim()
      if (term) {
        // フレーバー名/ブランドが一致するミックスも対象に含める
        const { data: mf } = await supabase
          .from('mix_flavors')
          .select('mix_id')
          .or(`name.ilike.%${term}%,brand.ilike.%${term}%`)
        const ids = [...new Set((mf ?? []).map((r) => r.mix_id as string))]
        const idClause = ids.length ? `,id.in.(${ids.join(',')})` : ''
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%${idClause}`)
      }
    }

    query =
      opts.sort === 'popular'
        ? query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
        : query.order('created_at', { ascending: false })

    const { data, error } = await query.limit(60)
    if (error) {
      console.error('[getMixes]', error.message)
      return []
    }
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch (e) {
    console.error('[getMixes] fatal', e)
    return []
  }
}

/** そのミックスが所持フレーバーだけで作れるか（brand|name がすべて棚にある） */
function isMakeable(mix: MixWithRelations, owned: Set<string>): boolean {
  const flavors = mix.mix_flavors ?? []
  if (flavors.length === 0) return false
  return flavors.every((f) => owned.has(flavorKey(f.brand, f.name)))
}

/** ミックス群を Combo（組み合わせ）単位に束ねる共通処理。owned が渡ると作れるものだけに絞る。 */
function buildCombos(
  mixes: MixWithRelations[],
  opts: FeedOptions,
  owned: Set<string> | null
): ComboSummary[] {
  const groups = new Map<string, MixWithRelations[]>()
  for (const m of mixes) {
    const key = m.combo_key || comboKey(m.mix_flavors ?? [])
    const arr = groups.get(key) ?? []
    arr.push(m)
    groups.set(key, arr)
  }

  const combos: ComboSummary[] = []
  for (const [key, methods] of groups) {
    // 「作れるものだけ」：どれか1つでも所持フレーバーで作れる作り方があるコンボのみ
    if (owned) {
      if (owned.size === 0) continue
      if (!methods.some((m) => isMakeable(m, owned))) continue
    }
    // 作り込み度を主・いいねを従に、詳しく書かれた作り方を定番（代表）にする
    methods.sort((a, b) => mixQuality(b) - mixQuality(a) || (a.created_at < b.created_at ? 1 : -1))
    const top = methods[0]
    const tagSet = new Set<string>()
    for (const m of methods) for (const t of m.taste_tags) tagSet.add(t)
    const latest = methods.reduce((mx, m) => (m.created_at > mx ? m.created_at : mx), methods[0].created_at)
    combos.push({
      key,
      slug: comboSlug(key),
      flavorNames: (top.mix_flavors ?? []).map((f) => f.name),
      methodCount: methods.length,
      totalLikes: methods.reduce((s, m) => s + m.like_count, 0),
      totalViews: methods.reduce((s, m) => s + (m.view_count ?? 0), 0),
      topScore: mixCompleteness(top),
      tags: [...tagSet].slice(0, 3),
      top,
      latest,
    })
  }

  combos.sort((a, b) => {
    if (opts.sort === 'popular') return b.totalLikes - a.totalLikes
    if (opts.sort === 'detailed') return b.topScore - a.topScore || (a.latest < b.latest ? 1 : -1)
    return a.latest < b.latest ? 1 : -1
  })
  return combos
}

/** フィード用：ミックス（作り方）を Combo（組み合わせ）単位にまとめる */
export async function getCombos(opts: FeedOptions = {}): Promise<ComboSummary[]> {
  const mixes = await getMixes(opts)
  // 「作れるものだけ」指定時は所持フレーバー集合を取得
  const owned = opts.makeableOnly ? await getOwnedFlavorKeys() : null
  return buildCombos(mixes, opts, owned)
}

/** 所持フレーバーで「あと1つ」だけ足りないコンボ（不足フレーバーを提示） */
export async function getNearMakeableForKeys(ownedKeys: Set<string>): Promise<NearMakeable[]> {
  if (ownedKeys.size === 0) return []
  const [mixes, flavorsMaster] = await Promise.all([getMixes({}), getFlavors()])
  const combos = buildCombos(mixes, { sort: 'detailed' }, null)
  const idByKey = new Map(flavorsMaster.map((f) => [flavorKey(f.brand, f.name), f.id]))
  const near: NearMakeable[] = []
  for (const c of combos) {
    const setFlavors = c.top.mix_flavors ?? []
    if (setFlavors.length < 2) continue // 単一フレーバーは「あと1つ」の対象外
    const missing = setFlavors.filter((f) => !ownedKeys.has(flavorKey(f.brand, f.name)))
    if (missing.length !== 1) continue
    const mf = missing[0]
    near.push({
      combo: c,
      missing: {
        brand: mf.brand,
        name: mf.name,
        flavorId: mf.flavor_id ?? idByKey.get(flavorKey(mf.brand, mf.name)) ?? null,
      },
    })
  }
  return near.slice(0, 12)
}

/** ログイン中ユーザーの「あと1つで作れる」コンボ */
export async function getMyNearMakeable(): Promise<NearMakeable[]> {
  const owned = await getOwnedFlavorKeys()
  return getNearMakeableForKeys(owned)
}

export type MakeableReps = {
  ready: NationalRep[]
  almost: { rep: NationalRep; missing: { brand: string | null; name: string; flavorId: string | null } }[]
}

/**
 * ログイン中ユーザーの棚（マイフレーバー）で「今作れる王道」「あと1種で作れる王道」を算出。
 * 王道(getNationalTeam)は公開データ・キャッシュ済み、棚はユーザー個別。
 * "あと1種"の不足フレーバーは購入導線（アフィリエイト）に自然につながる。
 */
export async function getMakeableReps(): Promise<MakeableReps> {
  try {
    const [team, ownedKeys, flavorsMaster] = await Promise.all([
      getNationalTeam(),
      getOwnedFlavorKeys(),
      getFlavors(),
    ])
    if (ownedKeys.size === 0 || team.length === 0) return { ready: [], almost: [] }
    const idByKey = new Map(flavorsMaster.map((f) => [flavorKey(f.brand, f.name), f.id]))
    const ready: NationalRep[] = []
    const almost: MakeableReps['almost'] = []
    for (const rep of team) {
      const fl = rep.mix.mix_flavors ?? []
      if (fl.length === 0) continue
      const missing = fl.filter((f) => !ownedKeys.has(flavorKey(f.brand, f.name)))
      if (missing.length === 0) ready.push(rep)
      else if (missing.length === 1) {
        const mf = missing[0]
        almost.push({
          rep,
          missing: {
            brand: mf.brand,
            name: mf.name,
            flavorId: mf.flavor_id ?? idByKey.get(flavorKey(mf.brand, mf.name)) ?? null,
          },
        })
      }
    }
    return { ready, almost }
  } catch {
    return { ready: [], almost: [] }
  }
}

/** Combo 詳細：その組み合わせの全ての作り方（Method） */
export async function getComboBySlug(
  slug: string
): Promise<{ key: string; flavorNames: string[]; methods: MixWithRelations[] } | null> {
  try {
    const key = comboKeyFromSlug(slug)
    const supabase = await createClient()
    const { data } = await supabase.from('mixes').select('*').eq('combo_key', key)
    const mixes = (data ?? []) as Mix[]
    if (mixes.length === 0) return null
    const methods = await attachRelations(supabase, mixes)
    // 作り込み度（詳しさ）を主・いいねを従に並べる
    methods.sort((a, b) => mixQuality(b) - mixQuality(a) || (a.created_at < b.created_at ? 1 : -1))
    return { key, flavorNames: (methods[0].mix_flavors ?? []).map((f) => f.name), methods }
  } catch {
    return null
  }
}

export async function getMixById(id: string): Promise<MixWithRelations | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('mixes').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    const mix = data as Mix
    // 通報により非表示のミックスは、投稿者本人と管理者以外には見せない
    if (mix.hidden) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let allowed = false
      if (user) {
        if (user.id === mix.author_id) allowed = true
        else {
          const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
          allowed = !!(prof as { is_admin?: boolean } | null)?.is_admin
        }
      }
      if (!allowed) return null
    }
    const [withRel] = await attachRelations(supabase, [mix])
    return withRel ?? null
  } catch {
    return null
  }
}

/** 指定ユーザーが投稿したミックス */
export async function getMixesByAuthor(authorId: string): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return []
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

/** 指定ボウル種別を使ったミックス（新しい順・写真ありを優先） */
export async function getMixesByBowlType(type: string): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .eq('bowl_type', type)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return []
    const mixes = attachRelations(supabase, (data ?? []) as Mix[])
    return mixes
  } catch {
    return []
  }
}

/** 指定HMS種別を使ったミックス（新しい順）。旧値エイリアス（kaloud→lotus）も拾う。 */
export async function getMixesByHmsType(type: string): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const values = type === 'lotus' ? ['lotus', 'kaloud'] : [type]
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .in('hms_type', values)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return []
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

/** 現在のユーザーが解錠済みの mix_id 集合（複数ミックスの判定用） */
export async function getMyUnlockedMixIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Set()
    const { data } = await supabase.from('mix_unlocks').select('mix_id').eq('user_id', user.id)
    return new Set((data ?? []).map((r) => r.mix_id as string))
  } catch {
    return new Set()
  }
}

/** 現在のユーザーがこのミックスの有料ノートを解錠済みか */
export async function isMixUnlocked(mixId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('mix_unlocks')
      .select('mix_id')
      .eq('mix_id', mixId)
      .eq('user_id', user.id)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

/** 現在のユーザーがいいね済みの mix_id 集合 */
export async function getLikedMixIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Set()
    const { data } = await supabase.from('likes').select('mix_id').eq('user_id', user.id)
    return new Set((data ?? []).map((r) => r.mix_id as string))
  } catch {
    return new Set()
  }
}

// ---------- コメント ----------
export async function getMixComments(mixId: string): Promise<CommentNode[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('mix_id', mixId)
      .eq('hidden', false)
      .order('created_at', { ascending: true })
    const comments = (data ?? []) as Comment[]
    if (comments.length === 0) return []
    const authorIds = [...new Set(comments.map((c) => c.user_id))]
    const commentIds = comments.map((c) => c.id)
    const [authorsRes, likesRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', authorIds),
      supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
    ])
    const byId = new Map<string, MixAuthor>()
    for (const a of (authorsRes.data ?? []) as MixAuthor[]) byId.set(a.id, a)
    const likeCount = new Map<string, number>()
    const myLiked = new Set<string>()
    for (const l of (likesRes.data ?? []) as { comment_id: string; user_id: string }[]) {
      likeCount.set(l.comment_id, (likeCount.get(l.comment_id) ?? 0) + 1)
      if (user && l.user_id === user.id) myLiked.add(l.comment_id)
    }
    const nodes: CommentNode[] = comments.map((c) => ({
      ...c,
      author: byId.get(c.user_id) ?? null,
      like_count: likeCount.get(c.id) ?? 0,
      my_liked: myLiked.has(c.id),
      replies: [],
    }))
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    const roots: CommentNode[] = []
    for (const n of nodes) {
      const parent = n.parent_id ? nodeById.get(n.parent_id) : null
      if (parent) parent.replies.push(n)
      else roots.push(n)
    }
    return roots
  } catch {
    return []
  }
}

// ---------- ブックマーク ----------
export async function getBookmarkedMixIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return new Set()
    const { data } = await supabase.from('bookmarks').select('mix_id').eq('user_id', user.id)
    return new Set((data ?? []).map((r) => r.mix_id as string))
  } catch {
    return new Set()
  }
}

export async function getBookmarkedMixes(): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('mix_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const ids = (bm ?? []).map((r) => r.mix_id as string)
    if (ids.length === 0) return []
    const { data } = await supabase.from('mixes').select('*').in('id', ids)
    const mixes = (data ?? []) as Mix[]
    // ブックマーク順を保持
    mixes.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    return attachRelations(supabase, mixes)
  } catch {
    return []
  }
}

/** フォロー中ユーザーの新着ミックス（タイムライン） */
export async function getFollowingMixes(): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data: fl } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    const ids = (fl ?? []).map((r) => r.following_id as string)
    if (ids.length === 0) return []
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .in('author_id', ids)
      .order('created_at', { ascending: false })
      .limit(60)
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

/** 現在のユーザーがいいねしたミックス */
export async function getLikedMixes(): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data: likes } = await supabase
      .from('likes')
      .select('mix_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const ids = (likes ?? []).map((r) => r.mix_id as string)
    if (ids.length === 0) return []
    const { data } = await supabase.from('mixes').select('*').in('id', ids)
    const mixes = (data ?? []) as Mix[]
    mixes.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    return attachRelations(supabase, mixes)
  } catch {
    return []
  }
}

// ---------- プロフィール / フォロー ----------
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle()
    return (data as Profile) ?? null
  } catch {
    return null
  }
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  try {
    const supabase = await createClient()
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    return { followers: followers ?? 0, following: following ?? 0 }
  } catch {
    return { followers: 0, following: 0 }
  }
}

export async function isFollowing(targetId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

// ---------- プロ認証 申請 ----------
export async function getMyProApplication(): Promise<ProApplication | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('pro_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as ProApplication) ?? null
  } catch {
    return null
  }
}

export async function getPendingProApplications(): Promise<ProApplicationWithUser[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('pro_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    const apps = (data ?? []) as ProApplication[]
    if (apps.length === 0) return []
    const userIds = [...new Set(apps.map((a) => a.user_id))]
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_shop, is_pro, shop_name')
      .in('id', userIds)
    const byId = new Map<string, MixAuthor>()
    for (const u of (users ?? []) as MixAuthor[]) byId.set(u.id, u)
    return apps.map((a) => ({ ...a, user: byId.get(a.user_id) ?? null }))
  } catch {
    return []
  }
}

// ---------- フレーバー図鑑 ----------
export async function getFlavors(): Promise<Flavor[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('flavors').select('*').order('brand').order('name')
    return (data ?? []) as Flavor[]
  } catch {
    return []
  }
}

/** フレーバー一覧に使用回数を付与（人気順の材料） */
export async function getFlavorsWithUsage(): Promise<(Flavor & { count: number })[]> {
  try {
    const supabase = await createClient()
    const [{ data: flavors }, { data: mf }] = await Promise.all([
      supabase.from('flavors').select('*').order('brand').order('name'),
      supabase.from('mix_flavors').select('flavor_id, brand, name'),
    ])
    const byId = new Map<string, number>()
    const byName = new Map<string, number>()
    for (const r of mf ?? []) {
      const fid = r.flavor_id as string | null
      if (fid) byId.set(fid, (byId.get(fid) ?? 0) + 1)
      else if (r.name) {
        const k = `${((r.brand as string) || '').toLowerCase()}|${(r.name as string).toLowerCase()}`
        byName.set(k, (byName.get(k) ?? 0) + 1)
      }
    }
    return ((flavors ?? []) as Flavor[]).map((f) => {
      const k = `${f.brand.toLowerCase()}|${f.name.toLowerCase()}`
      return { ...f, count: (byId.get(f.id) ?? 0) + (byName.get(k) ?? 0) }
    })
  } catch {
    return []
  }
}

/** ブランドの全フレーバー（使用回数つき・多い順） */
export async function getFlavorsByBrand(brand: string): Promise<(Flavor & { count: number })[]> {
  try {
    const supabase = await createClient()
    const [{ data: flavors }, { data: mf }] = await Promise.all([
      supabase.from('flavors').select('*').eq('brand', brand).order('name'),
      supabase.from('mix_flavors').select('flavor_id, name').eq('brand', brand),
    ])
    const byId = new Map<string, number>()
    const byName = new Map<string, number>()
    for (const r of mf ?? []) {
      const fid = r.flavor_id as string | null
      if (fid) byId.set(fid, (byId.get(fid) ?? 0) + 1)
      else if (r.name) byName.set((r.name as string).toLowerCase(), (byName.get((r.name as string).toLowerCase()) ?? 0) + 1)
    }
    return ((flavors ?? []) as Flavor[])
      .map((f) => ({ ...f, count: (byId.get(f.id) ?? 0) + (byName.get(f.name.toLowerCase()) ?? 0) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'))
  } catch {
    return []
  }
}

/** そのブランドのフレーバーを使っているミックス */
export async function getMixesUsingBrand(brand: string): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const { data: mf } = await supabase.from('mix_flavors').select('mix_id').eq('brand', brand)
    const ids = [...new Set((mf ?? []).map((r) => r.mix_id as string))]
    if (ids.length === 0) return []
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .in('id', ids)
      .order('like_count', { ascending: false })
      .limit(30)
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

export type SmokeLogEntry = {
  kind: 'smoked' | 'made' | 'rated'
  mix: MixWithRelations
  at: string
  score?: number
  shopName?: string | null
  verdict?: 'again' | 'good' | 'ok' | 'not_for_me' | null
}
export type SmokeLog = {
  entries: SmokeLogEntry[]
  smokedTotal: number
  madeTotal: number
  ratedTotal: number
  thisYear: number
}

/**
 * 煙道帳：ログイン中ユーザーの「作った！」＋「実地評価」の履歴を時系列でまとめる。
 * 再訪動機（記録が溜まる）＋シェア（年間まとめ）の土台。データが無ければ空で返す。
 */
export async function getSmokeLog(limit = 40): Promise<SmokeLog> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const empty: SmokeLog = { entries: [], smokedTotal: 0, madeTotal: 0, ratedTotal: 0, thisYear: 0 }
    if (!user) return empty
    // 吸った/作ってみた＝mix_experiences（本人分・RLS）／実地評価＝mix_onsite_ratings（従来どおり）
    const [expRes, ratesRes] = await Promise.all([
      supabase
        .from('mix_experiences')
        .select('mix_id, experience_type, verdict, occurred_at')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(limit),
      supabase.from('mix_onsite_ratings').select('mix_id, score, shop_id, rated_at').eq('user_id', user.id).not('rated_at', 'is', null).order('rated_at', { ascending: false }).limit(limit),
    ])
    const exps = (expRes.data ?? []) as {
      mix_id: string
      experience_type: 'smoked' | 'made'
      verdict: 'again' | 'good' | 'ok' | 'not_for_me' | null
      occurred_at: string
    }[]
    const rates = (ratesRes.data ?? []) as { mix_id: string; score: number; shop_id: string | null; rated_at: string }[]
    const mixIds = [...new Set([...exps.map((e) => e.mix_id), ...rates.map((r) => r.mix_id)])]
    if (mixIds.length === 0) return empty
    const shopIds = [...new Set(rates.map((r) => r.shop_id).filter((s): s is string => !!s))]
    const [mixRows, shopRows] = await Promise.all([
      supabase.from('mixes').select('*').in('id', mixIds),
      shopIds.length ? supabase.from('shops').select('id, name').in('id', shopIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ])
    const mixesWith = await attachRelations(supabase, (mixRows.data ?? []) as Mix[])
    const mixById = new Map(mixesWith.map((m) => [m.id, m]))
    const shopName = new Map(((shopRows.data ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]))
    const entries: SmokeLogEntry[] = []
    let smokedTotal = 0
    let madeTotal = 0
    for (const e of exps) {
      if (e.experience_type === 'made') madeTotal += 1
      else smokedTotal += 1
      const mix = mixById.get(e.mix_id)
      if (mix) entries.push({ kind: e.experience_type, mix, at: e.occurred_at, verdict: e.verdict })
    }
    for (const r of rates) {
      const mix = mixById.get(r.mix_id)
      if (mix) entries.push({ kind: 'rated', mix, at: r.rated_at, score: r.score, shopName: r.shop_id ? shopName.get(r.shop_id) ?? null : null })
    }
    entries.sort((a, b) => (a.at < b.at ? 1 : -1))
    const year = new Date().getFullYear()
    const thisYear = entries.filter((e) => new Date(e.at).getFullYear() === year).length
    return { entries: entries.slice(0, limit), smokedTotal, madeTotal, ratedTotal: rates.length, thisYear }
  } catch {
    return { entries: [], smokedTotal: 0, madeTotal: 0, ratedTotal: 0, thisYear: 0 }
  }
}

/** 「作った！」の件数と、現在ユーザーが作ったか（集計RPC経由） */
export async function getMadeStatus(mixId: string): Promise<{ count: number; made: boolean }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc('mix_made_status', { p_mix: mixId })
    const row = data?.[0]
    // 表示は「作った人数」＝ maker_count（延べ回数は made_count）
    return { count: row?.maker_count ?? 0, made: row?.made ?? false }
  } catch {
    return { count: 0, made: false }
  }
}

/** 「吸った」の件数・自分の直近記録（id・verdict）。集計RPC経由。 */
export async function getSmokeStatus(
  mixId: string
): Promise<{ count: number; smokerCount: number; mine: boolean; myId: string | null; myVerdict: 'again' | 'good' | 'ok' | 'not_for_me' | null }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc('mix_smoke_status', { p_mix: mixId })
    const row = data?.[0]
    return {
      count: row?.smoke_count ?? 0,
      smokerCount: row?.smoker_count ?? 0,
      mine: row?.mine ?? false,
      myId: row?.my_id ?? null,
      myVerdict: (row?.my_verdict as 'again' | 'good' | 'ok' | 'not_for_me' | null) ?? null,
    }
  } catch {
    return { count: 0, smokerCount: 0, mine: false, myId: null, myVerdict: null }
  }
}

/** 自分のフレーバー練習ログ（新しい順）。RLSで本人のみ。 */
export async function getFlavorLogs(flavorId: string): Promise<FlavorLog[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('flavor_logs')
      .select('*')
      .eq('flavor_id', flavorId)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(100)
    return (data ?? []) as FlavorLog[]
  } catch {
    return []
  }
}

/** 公開された研究メモ（他ユーザー分）。ベスト→高評価順。 */
export async function getPublicFlavorLogs(flavorId: string): Promise<FlavorLogWithAuthor[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('flavor_logs')
      .select('*')
      .eq('flavor_id', flavorId)
      .eq('is_public', true)
      .order('is_best', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(30)
    let rows = (data ?? []) as FlavorLog[]
    if (user) rows = rows.filter((r) => r.user_id !== user.id)
    if (rows.length === 0) return []
    const ids = [...new Set(rows.map((r) => r.user_id))]
    const logIds = rows.map((r) => r.id)
    const [authorsRes, helpfulRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', ids),
      supabase.from('flavor_log_helpful').select('log_id, user_id').in('log_id', logIds),
    ])
    const map = new Map((authorsRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    const helpfulCount = new Map<number, number>()
    const myHelpful = new Set<number>()
    for (const h of (helpfulRes.data ?? []) as { log_id: number; user_id: string }[]) {
      helpfulCount.set(h.log_id, (helpfulCount.get(h.log_id) ?? 0) + 1)
      if (user && h.user_id === user.id) myHelpful.add(h.log_id)
    }
    return rows
      .map((r) => ({
        ...r,
        author: map.get(r.user_id) ?? null,
        helpful_count: helpfulCount.get(r.id) ?? 0,
        my_helpful: myHelpful.has(r.id),
      }))
      .sort((a, b) => b.helpful_count - a.helpful_count || Number(b.is_best) - Number(a.is_best) || (b.rating ?? 0) - (a.rating ?? 0))
  } catch {
    return []
  }
}

/** フレーバーの平均評価・件数・自分の評価 */
export async function getFlavorRating(flavorId: string): Promise<{ avg: number; count: number; mine: number }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase.from('flavor_ratings').select('user_id, rating').eq('flavor_id', flavorId)
    const rows = (data ?? []) as { user_id: string; rating: number }[]
    const avg = rows.length ? rows.reduce((a, b) => a + b.rating, 0) / rows.length : 0
    const mine = user ? rows.find((r) => r.user_id === user.id)?.rating ?? 0 : 0
    return { avg, count: rows.length, mine }
  } catch {
    return { avg: 0, count: 0, mine: 0 }
  }
}

/** 期間別ランキング。week/month は期間内のいいね数、all は累計いいね順。 */
export async function getRankedMixes(period: 'week' | 'month' | 'all'): Promise<MixWithRelations[]> {
  try {
    // 公開レシピを微優遇（openRankValue）。差は小さく、人気が大きく上なら順位は保たれる。
    if (period === 'all') {
      const mixes = await getMixes({ sort: 'popular' })
      return mixes
        .slice()
        .sort((a, b) => openRankValue(b.like_count, isFullyOpen(b)) - openRankValue(a.like_count, isFullyOpen(a)))
    }
    const supabase = await createClient()
    const days = period === 'week' ? 7 : 30
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    const { data: likes } = await supabase.from('likes').select('mix_id').gte('created_at', cutoff).limit(5000)
    const counts = new Map<string, number>()
    for (const l of likes ?? []) {
      const id = (l as { mix_id: string }).mix_id
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map((e) => e[0])
    if (topIds.length === 0) return []
    const { data } = await supabase.from('mixes').select('*').in('id', topIds).eq('hidden', false)
    const mixes = await attachRelations(supabase, (data ?? []) as Mix[])
    return mixes.sort(
      (a, b) =>
        openRankValue(counts.get(b.id) ?? 0, isFullyOpen(b)) - openRankValue(counts.get(a.id) ?? 0, isFullyOpen(a))
    )
  } catch {
    return []
  }
}

/**
 * 日本代表（殿堂）を選出する。系統（TYPE_TAGS）ごとに、支持スコアが最も高い
 * ミックスを1つ「代表」として選ぶ。スコア = いいね数 + 「作った！」数×2
 * （実際に作られた＝より強い支持、と重み付け）。
 * 初期はデータが少ないため、AI生成サンプルも候補に含める（バッジで区別済み）。
 */
// 公開データの重い集計（最大 1000 mix + 10000 makes + 10000 onsite を JS 集計）。
// /national・/mix/[id]（王道バッジ）・/u/[username]（実績）から毎回呼ばれるため、
// クッキー非依存の公開クライアントで計算し 5 分キャッシュする（王道は最短でも5分間隔で更新）。
const _getNationalTeamCached = unstable_cache(
  async (): Promise<NationalRep[]> => {
    const supabase = createPublicClient()
    const { data } = await supabase.from('mixes').select('*').eq('hidden', false).limit(1000)
    const mixes = (data ?? []) as Mix[]
    if (mixes.length === 0) return []

    const [{ data: makesRows }, { data: onsiteRows }] = await Promise.all([
      // 「作ってみた(made)」のユニークメイカー数（mix_experiences 集計RPC）
      supabase.rpc('mix_made_counts'),
      // 支持シグナルは「採点済み(rated_at)かつ★4以上」の実地評価のみ
      supabase.from('mix_onsite_ratings').select('mix_id').not('rated_at', 'is', null).gte('score', 4).limit(10000),
    ])
    const makes = new Map<string, number>()
    for (const r of makesRows ?? []) {
      const row = r as { mix_id: string; maker_count: number }
      makes.set(row.mix_id, row.maker_count)
    }
    // 実地評価は「現地で実物を吸って評価した」検証済みの票。いいね(×1)・作った(×2)より
    // 大きく重み付けする（×5）。コアループ＝現地評価を選出の主軸にするため。
    const onsite = new Map<string, number>()
    for (const r of onsiteRows ?? []) {
      const id = (r as { mix_id: string }).mix_id
      onsite.set(id, (onsite.get(id) ?? 0) + 1)
    }
    const scoreOf = (m: Mix) => mixSupportScore(m.like_count, makes.get(m.id) ?? 0, onsite.get(m.id) ?? 0)

    // 系統ごとに代表を選ぶ。ルール：
    //  1) 支持スコア(いいね+作った×2)が1以上あること（無支持のサンプルを代表にしない）
    //  2) 本物のレシピ(author_idあり)に支持があれば、AI生成サンプルより優先
    //  （汎用性の高い名ミックスは複数ポジションを兼任しうる＝重複を許容）
    const reps: { category: string; mix: Mix; score: number; sample: boolean }[] = []
    for (const cat of TYPE_TAGS) {
      // 日本代表は「いま公開されているレシピ」だけが対象（ロック中は選出対象外）
      const inCat = mixes.filter((m) => (m.taste_tags ?? []).includes(cat) && scoreOf(m) >= 1 && !isActivelyLocked(m))
      if (inCat.length === 0) continue
      const real = inCat.filter((m) => m.author_id)
      const pool = real.length > 0 ? real : inCat
      const best = pool.reduce((a, b) => (scoreOf(b) > scoreOf(a) ? b : a))
      reps.push({ category: cat, mix: best, score: scoreOf(best), sample: !best.author_id })
    }
    if (reps.length === 0) return []

    // 重複ミックスも1回だけ取得して結合
    const uniqueMixes = [...new Map(reps.map((r) => [r.mix.id, r.mix])).values()]
    const withRel = await attachRelations(supabase, uniqueMixes)
    const byId = new Map(withRel.map((m) => [m.id, m]))

    return reps
      .map((r) => ({
        category: r.category,
        mix: byId.get(r.mix.id) as MixWithRelations,
        score: r.score,
        likes: r.mix.like_count,
        makes: makes.get(r.mix.id) ?? 0,
        onsite: onsite.get(r.mix.id) ?? 0,
        sample: r.sample,
      }))
      .filter((r) => r.mix)
      .sort((a, b) => b.score - a.score)
  },
  ['national-team-v1'],
  { revalidate: 300, tags: ['national'] }
)

/** 系統ごとの王道（公開データの集計・5分キャッシュ）。 */
export async function getNationalTeam(): Promise<NationalRep[]> {
  try {
    return await _getNationalTeamCached()
  } catch {
    return []
  }
}

/** 代表スナップショットを再計算し、変化があれば投稿者へ通知する（best-effort）。 */
export async function refreshNationalReps(): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.rpc('refresh_national_reps')
  } catch {
    // best-effort（表示は getNationalTeam が常に最新を計算するため影響なし）
  }
}

/** 作り手の実績サマリー（プロフィールの"作品集"表示用）。 */
export async function getAuthorStats(
  authorId: string
): Promise<{ mixCount: number; totalLikes: number; totalMakes: number; repCategories: string[] }> {
  try {
    const supabase = await createClient()
    const { data: mixes } = await supabase
      .from('mixes')
      .select('id, like_count')
      .eq('author_id', authorId)
      .eq('hidden', false)
    const rows = (mixes ?? []) as { id: string; like_count: number }[]
    const mixIds = rows.map((r) => r.id)
    const totalLikes = rows.reduce((s, r) => s + (r.like_count ?? 0), 0)
    let totalMakes = 0
    if (mixIds.length) {
      const { data: madeTotal } = await supabase.rpc('author_made_total', { p_author: authorId })
      totalMakes = (madeTotal as number | null) ?? 0
    }
    const team = await getNationalTeam()
    const repCategories = team.filter((r) => !r.sample && r.mix.author_id === authorId).map((r) => r.category)
    return { mixCount: rows.length, totalLikes, totalMakes, repCategories }
  } catch {
    return { mixCount: 0, totalLikes: 0, totalMakes: 0, repCategories: [] }
  }
}

/** ミックスの公募ネーミング（名前案＋投票数）。得票の多い順。 */
export async function getMixNames(mixId: string): Promise<MixNameWithVotes[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase.from('mix_names').select('*').eq('mix_id', mixId)
    const names = (data ?? []) as MixName[]
    if (names.length === 0) return []
    const ids = names.map((n) => n.id)
    const authorIds = [...new Set(names.map((n) => n.user_id).filter(Boolean) as string[])]
    const [votesRes, authorsRes] = await Promise.all([
      supabase.from('mix_name_votes').select('name_id, user_id').in('name_id', ids),
      authorIds.length
        ? supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', authorIds)
        : Promise.resolve({ data: [] }),
    ])
    const count = new Map<number, number>()
    const mine = new Set<number>()
    for (const v of (votesRes.data ?? []) as { name_id: number; user_id: string }[]) {
      count.set(v.name_id, (count.get(v.name_id) ?? 0) + 1)
      if (user && v.user_id === user.id) mine.add(v.name_id)
    }
    const amap = new Map((authorsRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    return names
      .map((n) => ({
        ...n,
        author: n.user_id ? amap.get(n.user_id) ?? null : null,
        votes: count.get(n.id) ?? 0,
        myVote: mine.has(n.id),
      }))
      .sort((a, b) => b.votes - a.votes || (a.created_at < b.created_at ? -1 : 1))
  } catch {
    return []
  }
}

/** このミックスが現在「日本代表」に選ばれている系統の一覧（暫定代表=サンプルは除く）。 */
export async function getNationalRepCategories(mixId: string): Promise<string[]> {
  try {
    const team = await getNationalTeam()
    return team.filter((r) => r.mix.id === mixId && !r.sample).map((r) => r.category)
  } catch {
    return []
  }
}

/**
 * 地域別ランキング。都会ほどいいねが集まる偏りを避けるため、地方（地域）ごとに
 * ・お店ランキング（旅行者向け「その地域で美味しいお店」）
 * ・ミックスランキング
 * を出す。お店スコアは実地評価を最重視（onsite×5＋いいね＋作った×2）。
 * ミックスの地域は「投稿者が承認所属し、都道府県を登録している店」で決まる。
 */
const _getAreaRankingsCached = unstable_cache(
  async (shopsPerRegion: number, mixesPerRegion: number): Promise<RegionRanking[]> => {
    const supabase = createPublicClient()

    // 1) 都道府県を登録済みのお店
    const { data: shopRows } = await supabase.from('shops').select('*').not('prefecture', 'is', null)
    const shops = (shopRows ?? []) as Shop[]

    // 2) 承認所属メンバー（お店 ↔ 作り手）
    const shopIds = shops.map((s) => s.id)
    const { data: memRows } = shopIds.length
      ? await supabase.from('shop_members').select('shop_id, user_id, role').eq('status', 'approved').in('shop_id', shopIds)
      : { data: [] as { shop_id: string; user_id: string; role: string }[] }
    const members = (memRows ?? []) as { shop_id: string; user_id: string; role: string }[]

    // 3) 全ミックス・作った・実地評価
    const [{ data: mixRows }, { data: makeRows }, { data: onsiteRows }] = await Promise.all([
      supabase.from('mixes').select('*').eq('hidden', false).limit(2000),
      supabase.rpc('mix_made_counts'),
      supabase.from('mix_onsite_ratings').select('mix_id, shop_id').not('rated_at', 'is', null).gte('score', 4).limit(20000),
    ])
    const mixes = (mixRows ?? []) as Mix[]
    const makes = new Map<string, number>()
    for (const r of makeRows ?? []) {
      const row = r as { mix_id: string; maker_count: number }
      makes.set(row.mix_id, row.maker_count)
    }
    const onsiteByMix = new Map<string, number>()
    const onsiteByShop = new Map<string, number>()
    for (const r of onsiteRows ?? []) {
      const mid = (r as { mix_id: string }).mix_id
      const sid = (r as { shop_id: string | null }).shop_id
      onsiteByMix.set(mid, (onsiteByMix.get(mid) ?? 0) + 1)
      if (sid) onsiteByShop.set(sid, (onsiteByShop.get(sid) ?? 0) + 1)
    }
    const mixScore = (m: Mix) => mixSupportScore(m.like_count, makes.get(m.id) ?? 0, onsiteByMix.get(m.id) ?? 0)
    const mixById = new Map(mixes.map((m) => [m.id, m]))

    // 作り手 → 所属お店（複数可）／作り手 → 都道府県（オーナー優先→最初）
    const shopById = new Map(shops.map((s) => [s.id, s]))
    const memberMixesByShop = new Map<string, string[]>() // shop_id → mix_ids（所属作り手の作品）
    const authorPref = new Map<string, string>()
    // authorId → 所属shopの配列
    const shopsByAuthor = new Map<string, { shop_id: string; role: string }[]>()
    for (const m of members) {
      const arr = shopsByAuthor.get(m.user_id) ?? []
      arr.push({ shop_id: m.shop_id, role: m.role })
      shopsByAuthor.set(m.user_id, arr)
    }
    for (const [uid, arr] of shopsByAuthor) {
      // 都道府県：オーナーの店を優先、それ以外は先頭
      const owner = arr.find((a) => a.role === 'owner')
      const chosen = owner ?? arr[0]
      const pref = shopById.get(chosen.shop_id)?.prefecture
      if (pref) authorPref.set(uid, pref)
    }
    // お店ごとの所属作り手の作品を集める
    const authorsByShop = new Map<string, string[]>()
    for (const m of members) {
      const arr = authorsByShop.get(m.shop_id) ?? []
      arr.push(m.user_id)
      authorsByShop.set(m.shop_id, arr)
    }
    const mixesByAuthor = new Map<string, string[]>()
    for (const m of mixes) {
      if (!m.author_id) continue
      const arr = mixesByAuthor.get(m.author_id) ?? []
      arr.push(m.id)
      mixesByAuthor.set(m.author_id, arr)
    }
    for (const s of shops) {
      const ids: string[] = []
      for (const uid of authorsByShop.get(s.id) ?? []) ids.push(...(mixesByAuthor.get(uid) ?? []))
      memberMixesByShop.set(s.id, [...new Set(ids)])
    }

    // 4) お店スコア
    type ShopCalc = { shop: Shop; onsite: number; supporters: number; score: number; topMixId: string | null; region: RegionKey }
    const shopItems: ShopCalc[] = []
    for (const s of shops) {
      const region = regionOf(s.prefecture)
      if (!region) continue
      const memMixIds = memberMixesByShop.get(s.id) ?? []
      let likes = 0
      let makesN = 0
      let topMixId: string | null = null
      let topScore = -1
      for (const mid of memMixIds) {
        const mm = mixById.get(mid)
        if (!mm) continue
        likes += mm.like_count
        makesN += makes.get(mid) ?? 0
        const sc = mixScore(mm)
        if (sc > topScore) {
          topScore = sc
          topMixId = mm.id
        }
      }
      const onsite = onsiteByShop.get(s.id) ?? 0
      const score = shopSupportScore(onsite, likes, makesN)
      shopItems.push({ shop: s, onsite, supporters: likes + makesN, score, topMixId, region })
    }

    // 5) 地域別ミックス
    const regionMixesRaw = new Map<RegionKey, { mix: Mix; score: number; onsite: number; prefecture: string }[]>()
    for (const m of mixes) {
      if (!m.author_id) continue
      if (isActivelyLocked(m)) continue // 地方代表も公開レシピのみ
      const pref = authorPref.get(m.author_id)
      if (!pref) continue
      const region = regionOf(pref)
      if (!region) continue
      const arr = regionMixesRaw.get(region) ?? []
      arr.push({ mix: m, score: mixScore(m), onsite: onsiteByMix.get(m.id) ?? 0, prefecture: pref })
      regionMixesRaw.set(region, arr)
    }

    // 6) 必要なミックスにリレーションを付与（topMix ＋ 地域ミックス上位）
    const neededIds = new Set<string>()
    for (const it of shopItems) {
      if (it.topMixId) neededIds.add(it.topMixId)
    }
    for (const [region, arr] of regionMixesRaw) {
      arr.sort((a, b) => b.score - a.score || (a.mix.created_at < b.mix.created_at ? 1 : -1))
      regionMixesRaw.set(region, arr.slice(0, mixesPerRegion))
      for (const x of regionMixesRaw.get(region)!) neededIds.add(x.mix.id)
    }
    const needed = [...neededIds].map((id) => mixById.get(id)).filter((m): m is Mix => !!m)
    const withRel = await attachRelations(supabase, needed)
    const relById = new Map(withRel.map((m) => [m.id, m]))

    // 7) 地方ごとに組み立て
    const shopsByRegion = new Map<RegionKey, ShopRankItem[]>()
    for (const it of shopItems) {
      const clean: ShopRankItem = {
        shop: it.shop,
        onsite: it.onsite,
        supporters: it.supporters,
        score: it.score,
        topMix: it.topMixId ? relById.get(it.topMixId) ?? null : null,
      }
      const arr = shopsByRegion.get(it.region) ?? []
      arr.push(clean)
      shopsByRegion.set(it.region, arr)
    }

    const result: RegionRanking[] = []
    for (const r of REGIONS) {
      const shopList = (shopsByRegion.get(r.key) ?? [])
        .sort((a, b) => b.score - a.score || b.onsite - a.onsite)
        .slice(0, shopsPerRegion)
      const mixList: RegionMix[] = (regionMixesRaw.get(r.key) ?? [])
        .map((x) => ({ mix: relById.get(x.mix.id)!, score: x.score, onsite: x.onsite, prefecture: x.prefecture }))
        .filter((x) => x.mix)
      if (shopList.length === 0 && mixList.length === 0) continue
      result.push({ region: r.key, emoji: REGION_EMOJI.get(r.key) ?? '📍', shops: shopList, mixes: mixList })
    }
    return result
  },
  ['area-rankings-v1'],
  { revalidate: 300, tags: ['areas'] }
)

/** 地域別ランキング（公開データ集計・5分キャッシュ）。 */
export async function getAreaRankings(opts: { shopsPerRegion?: number; mixesPerRegion?: number } = {}): Promise<RegionRanking[]> {
  try {
    return await _getAreaRankingsCached(opts.shopsPerRegion ?? 5, opts.mixesPerRegion ?? 4)
  } catch {
    return []
  }
}

/** このミックスが「地方代表」（所属都道府県が属する地方で最高スコア／支持1以上）ならその地方名を返す。 */
export async function getRegionRepLabel(mixId: string): Promise<string | null> {
  try {
    const regions = await getAreaRankings({ mixesPerRegion: 1 })
    for (const r of regions) {
      const top = r.mixes[0]
      if (top && top.mix.id === mixId && top.score >= 1) return r.region
    }
    return null
  } catch {
    return null
  }
}

/**
 * 位置を登録済みの全お店を、支持スコア付き・代表作リレーション付きで返す（距離順の並べ替えはクライアント側）。
 * 「現在地から近い高評価店」導線に使用。
 */
export async function getNearbyShops(): Promise<ShopRankItem[]> {
  try {
    const supabase = await createClient()
    const { data: shopRows } = await supabase
      .from('shops')
      .select('*')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
    const shops = (shopRows ?? []) as Shop[]
    if (shops.length === 0) return []
    const shopIds = shops.map((s) => s.id)

    const [{ data: memRows }, { data: mixRows }, { data: makeRows }, { data: onsiteRows }] = await Promise.all([
      supabase.from('shop_members').select('shop_id, user_id').eq('status', 'approved').in('shop_id', shopIds),
      supabase.from('mixes').select('*').eq('hidden', false).limit(2000),
      supabase.rpc('mix_made_counts'),
      supabase.from('mix_onsite_ratings').select('mix_id, shop_id').not('rated_at', 'is', null).gte('score', 4).limit(20000),
    ])
    const members = (memRows ?? []) as { shop_id: string; user_id: string }[]
    const mixes = (mixRows ?? []) as Mix[]
    const mixById = new Map(mixes.map((m) => [m.id, m]))
    const makes = new Map<string, number>()
    for (const r of makeRows ?? []) {
      const row = r as { mix_id: string; maker_count: number }
      makes.set(row.mix_id, row.maker_count)
    }
    const onsiteByMix = new Map<string, number>()
    const onsiteByShop = new Map<string, number>()
    for (const r of onsiteRows ?? []) {
      const mid = (r as { mix_id: string }).mix_id
      const sid = (r as { shop_id: string | null }).shop_id
      onsiteByMix.set(mid, (onsiteByMix.get(mid) ?? 0) + 1)
      if (sid) onsiteByShop.set(sid, (onsiteByShop.get(sid) ?? 0) + 1)
    }
    const mixScore = (m: Mix) => mixSupportScore(m.like_count, makes.get(m.id) ?? 0, onsiteByMix.get(m.id) ?? 0)

    const mixesByAuthor = new Map<string, string[]>()
    for (const m of mixes) {
      if (!m.author_id) continue
      const arr = mixesByAuthor.get(m.author_id) ?? []
      arr.push(m.id)
      mixesByAuthor.set(m.author_id, arr)
    }
    const authorsByShop = new Map<string, string[]>()
    for (const m of members) {
      const arr = authorsByShop.get(m.shop_id) ?? []
      arr.push(m.user_id)
      authorsByShop.set(m.shop_id, arr)
    }

    const items: (Omit<ShopRankItem, 'topMix'> & { topMixId: string | null })[] = []
    for (const s of shops) {
      const memMixIds = new Set<string>()
      for (const uid of authorsByShop.get(s.id) ?? []) for (const mid of mixesByAuthor.get(uid) ?? []) memMixIds.add(mid)
      let likes = 0
      let makesN = 0
      let topMixId: string | null = null
      let topScore = -1
      for (const mid of memMixIds) {
        const mm = mixById.get(mid)
        if (!mm) continue
        likes += mm.like_count
        makesN += makes.get(mid) ?? 0
        const sc = mixScore(mm)
        if (sc > topScore) {
          topScore = sc
          topMixId = mm.id
        }
      }
      const onsite = onsiteByShop.get(s.id) ?? 0
      items.push({ shop: s, onsite, supporters: likes + makesN, score: shopSupportScore(onsite, likes, makesN), topMixId })
    }

    const needed = [...new Set(items.map((i) => i.topMixId).filter((v): v is string => !!v))]
      .map((id) => mixById.get(id))
      .filter((m): m is Mix => !!m)
    const withRel = await attachRelations(supabase, needed)
    const relById = new Map(withRel.map((m) => [m.id, m]))

    return items.map((i) => ({
      shop: i.shop,
      onsite: i.onsite,
      supporters: i.supporters,
      score: i.score,
      topMix: i.topMixId ? relById.get(i.topMixId) ?? null : null,
    }))
  } catch {
    return []
  }
}

/** 実地評価の表示コンテキスト（総数・自分の評価済み・投稿者の位置登録済み店舗）。 */
export async function getOnsiteContext(mix: Mix): Promise<OnsiteContext> {
  const empty: OnsiteContext = {
    count: 0,
    avg: null,
    myState: 'none',
    myScore: null,
    availableAt: null,
    isOwn: false,
    isSample: mix.author_id === null,
    shops: [],
  }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: rowData } = await supabase
      .from('mix_onsite_ratings')
      .select('user_id, created_at, rated_at, score')
      .eq('mix_id', mix.id)
    const rows = (rowData ?? []) as { user_id: string; created_at: string; rated_at: string | null; score: number | null }[]

    // 確定（採点済み）の集計
    const rated = rows.filter((r) => r.rated_at && r.score != null)
    const count = rated.length
    const avg = count > 0 ? rated.reduce((s, r) => s + (r.score ?? 0), 0) / count : null

    // 自分の状態
    const DELAY_MS = 24 * 60 * 60 * 1000
    let myState: OnsiteContext['myState'] = 'none'
    let myScore: number | null = null
    let availableAt: string | null = null
    const mine = user ? rows.find((r) => r.user_id === user.id) : undefined
    if (mine) {
      if (mine.rated_at) {
        myState = 'rated'
        myScore = mine.score
      } else {
        const unlock = new Date(mine.created_at).getTime() + DELAY_MS
        availableAt = new Date(unlock).toISOString()
        myState = Date.now() >= unlock ? 'can_rate' : 'waiting'
      }
    }

    const isOwn = !!user && !!mix.author_id && user.id === mix.author_id
    const isSample = mix.author_id === null

    // 投稿者が承認所属していて、位置が登録済みのお店
    let shops: OnsiteContext['shops'] = []
    if (mix.author_id) {
      const { data: mem } = await supabase
        .from('shop_members')
        .select('shop_id')
        .eq('user_id', mix.author_id)
        .eq('status', 'approved')
      const shopIds = [...new Set((mem ?? []).map((m) => (m as { shop_id: string }).shop_id))]
      if (shopIds.length) {
        const { data: srows } = await supabase
          .from('shops')
          .select('id, name, area, lat, lng')
          .in('id', shopIds)
        shops = ((srows ?? []) as (Pick<Shop, 'id' | 'name' | 'area' | 'lat' | 'lng'>)[])
          .filter((s) => s.lat != null && s.lng != null)
          .map((s) => ({ id: s.id, name: s.name, area: s.area }))
      }
    }

    return { count, avg, myState, myScore, availableAt, isOwn, isSample, shops }
  } catch {
    return empty
  }
}

/** 意見箱の一覧（投稿者・投票集計付き）。いいねが多い順（＝改修希望が高い順）。 */
export async function getIdeas(): Promise<IdeaWithVotes[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(300)
    const ideas = (data ?? []) as Idea[]
    if (ideas.length === 0) return []
    const ids = ideas.map((i) => i.id)
    const authorIds = [...new Set(ideas.map((i) => i.user_id).filter(Boolean) as string[])]
    const [votesRes, commentsRes, arbRes] = await Promise.all([
      supabase.from('idea_votes').select('idea_id, user_id, value, reason').in('idea_id', ids),
      supabase.from('idea_comments').select('*').in('idea_id', ids).order('created_at', { ascending: true }),
      supabase.from('idea_arbitrations').select('*').in('idea_id', ids),
    ])
    // コメント投稿者も著者一覧に含めてまとめて取得
    const commentUserIds = ((commentsRes.data ?? []) as IdeaComment[]).map((c) => c.user_id).filter(Boolean) as string[]
    const allAuthorIds = [...new Set([...authorIds, ...commentUserIds])]
    const authorsRes = allAuthorIds.length
      ? await supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', allAuthorIds)
      : { data: [] }
    const up = new Map<number, number>()
    const down = new Map<number, number>()
    const mine = new Map<number, number>()
    const reasons = new Map<number, string[]>()
    for (const v of (votesRes.data ?? []) as { idea_id: number; user_id: string; value: number; reason: string | null }[]) {
      if (v.value === 1) up.set(v.idea_id, (up.get(v.idea_id) ?? 0) + 1)
      else if (v.value === -1) {
        down.set(v.idea_id, (down.get(v.idea_id) ?? 0) + 1)
        if (v.reason) reasons.set(v.idea_id, [...(reasons.get(v.idea_id) ?? []), v.reason])
      }
      if (user && v.user_id === user.id) mine.set(v.idea_id, v.value)
    }
    const amap = new Map((authorsRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    const commentsByIdea = new Map<number, IdeaCommentWithAuthor[]>()
    for (const c of (commentsRes.data ?? []) as IdeaComment[]) {
      const withAuthor: IdeaCommentWithAuthor = { ...c, author: c.user_id ? amap.get(c.user_id) ?? null : null }
      commentsByIdea.set(c.idea_id, [...(commentsByIdea.get(c.idea_id) ?? []), withAuthor])
    }
    const arbByIdea = new Map((arbRes.data ?? []).map((a) => [(a as IdeaArbitration).idea_id, a as IdeaArbitration]))
    return ideas
      .map((i) => {
        const u = up.get(i.id) ?? 0
        const d = down.get(i.id) ?? 0
        return {
          ...i,
          author: i.user_id ? amap.get(i.user_id) ?? null : null,
          up: u,
          down: d,
          myVote: mine.get(i.id) ?? 0,
          score: u - d,
          downReasons: reasons.get(i.id) ?? [],
          comments: commentsByIdea.get(i.id) ?? [],
          arbitration: arbByIdea.get(i.id) ?? null,
        }
      })
      .sort((a, b) => {
        // 対応済み/見送りは下へ。それ以外はスコア→いいね→新着
        const done = (x: IdeaWithVotes) => (x.status === 'done' || x.status === 'declined' ? 1 : 0)
        if (done(a) !== done(b)) return done(a) - done(b)
        return b.score - a.score || b.up - a.up || (a.created_at < b.created_at ? 1 : -1)
      })
  } catch {
    return []
  }
}

/** 通報一覧（管理者のみ・RLSで制御）。通報者と対象ミックス名付き。 */
export async function getReports(): Promise<(Report & { reporter: MixAuthor | null; mixTitle: string | null })[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200)
    const rows = (data ?? []) as Report[]
    if (rows.length === 0) return []
    const reporterIds = [...new Set(rows.map((r) => r.reporter_id))]
    const mixIds = [...new Set(rows.map((r) => r.mix_id).filter(Boolean) as string[])]
    const [repRes, mixRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', reporterIds),
      mixIds.length ? supabase.from('mixes').select('id, title').in('id', mixIds) : Promise.resolve({ data: [] }),
    ])
    const rmap = new Map((repRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    const mmap = new Map((mixRes.data ?? []).map((m) => [(m as { id: string }).id, (m as { title: string }).title]))
    return rows.map((r) => ({
      ...r,
      reporter: r.reporter_id ? rmap.get(r.reporter_id) ?? null : null,
      mixTitle: r.mix_id ? mmap.get(r.mix_id) ?? null : null,
    }))
  } catch {
    return []
  }
}

/** ログインユーザー向けのおすすめミックス（いいねした味わいタグから類推） */
export async function getRecommendedMixes(limit = 6): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data: likes } = await supabase.from('likes').select('mix_id').eq('user_id', user.id).limit(200)
    const likedIds = new Set((likes ?? []).map((l) => (l as { mix_id: string }).mix_id))
    if (likedIds.size === 0) return []
    const { data: likedMixes } = await supabase.from('mixes').select('taste_tags').in('id', [...likedIds])
    const tagCount = new Map<string, number>()
    for (const m of likedMixes ?? []) {
      for (const t of ((m as { taste_tags: string[] }).taste_tags ?? [])) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
    }
    const tags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0])
    if (tags.length === 0) return []
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .overlaps('taste_tags', tags)
      .order('like_count', { ascending: false })
      .limit(limit + likedIds.size + 6)
    const mixes = ((data ?? []) as Mix[]).filter((m) => !likedIds.has(m.id) && m.author_id !== user.id).slice(0, limit)
    if (mixes.length === 0) return []
    return attachRelations(supabase, mixes)
  } catch {
    return []
  }
}

/** オンボーディングの進捗（棚登録・初投稿） */
export async function getOnboardingStatus(): Promise<{ hasShelf: boolean; hasPosted: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { hasShelf: false, hasPosted: false }
    const [shelfRes, postRes] = await Promise.all([
      supabase.from('shelf').select('flavor_id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('mixes').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    ])
    return { hasShelf: (shelfRes.count ?? 0) > 0, hasPosted: (postRes.count ?? 0) > 0 }
  } catch {
    return { hasShelf: false, hasPosted: false }
  }
}

/** 未読通知の件数 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    return count ?? 0
  } catch {
    return 0
  }
}

/** 自分宛の通知一覧（行為者・対象ミックス付き） */
export async function getNotifications(): Promise<NotificationWithContext[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    const rows = (data ?? []) as Notification[]
    if (rows.length === 0) return []
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])]
    const mixIds = [...new Set(rows.map((r) => r.mix_id).filter(Boolean) as string[])]
    const [actorsRes, mixesRes] = await Promise.all([
      actorIds.length
        ? supabase.from('profiles').select('id, username, display_name, is_shop, is_pro, shop_name').in('id', actorIds)
        : Promise.resolve({ data: [] }),
      mixIds.length ? supabase.from('mixes').select('id, title').in('id', mixIds) : Promise.resolve({ data: [] }),
    ])
    const actorMap = new Map((actorsRes.data ?? []).map((a) => [(a as MixAuthor).id, a as MixAuthor]))
    const mixMap = new Map((mixesRes.data ?? []).map((m) => [(m as { id: string }).id, m as { id: string; title: string }]))
    return rows.map((r) => ({
      ...r,
      actor: r.actor_id ? actorMap.get(r.actor_id) ?? null : null,
      mix: r.mix_id ? mixMap.get(r.mix_id) ?? null : null,
    }))
  } catch {
    return []
  }
}

/** 自分宛の未読通知をすべて既読にする */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  } catch {
    // noop
  }
}

/** ミックスの追加写真URL（position順） */
export async function getMixPhotos(mixId: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('mix_photos')
      .select('url, position')
      .eq('mix_id', mixId)
      .order('position', { ascending: true })
      .limit(8)
    return (data ?? []).map((r) => (r as { url: string }).url)
  } catch {
    return []
  }
}

/** 盛り方写真がある最近のミックス（トップの写真ストリップ用） */
export async function getRecentPhotoMixes(limit = 12): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .not('pack_photo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

/** PostgREST の or フィルタを壊す記号を除去したバリエーション（かな/カナ・大小） */
function likeVariants(term: string): string[] {
  return searchVariants(term)
    .map((v) => v.replace(/[,()%_*]/g, ' ').trim())
    .filter(Boolean)
}

/** ミックス検索（タイトル・説明・フレーバー名・味わいタグ）。表記ゆれ吸収・人気優先。 */
export async function searchMixes(q: string): Promise<MixWithRelations[]> {
  const variants = likeVariants(q)
  if (variants.length === 0) return []
  try {
    const supabase = await createClient()
    const textOr = variants.flatMap((v) => [`title.ilike.%${v}%`, `description.ilike.%${v}%`]).join(',')
    const nameOr = variants.map((v) => `name.ilike.%${v}%`).join(',')
    const [{ data: byText }, { data: mf }] = await Promise.all([
      supabase.from('mixes').select('*').or(textOr).limit(50),
      supabase.from('mix_flavors').select('mix_id').or(nameOr).limit(300),
    ])
    // タグは変種いずれかを含む
    const tagResults = await Promise.all(
      variants.map((v) => supabase.from('mixes').select('*').contains('taste_tags', [v]).limit(50))
    )
    const flavorIds = [...new Set((mf ?? []).map((r) => r.mix_id as string))]
    let byFlavor: Mix[] = []
    if (flavorIds.length) {
      const { data } = await supabase.from('mixes').select('*').in('id', flavorIds).limit(50)
      byFlavor = (data ?? []) as Mix[]
    }
    const map = new Map<string, Mix>()
    for (const m of [
      ...((byText ?? []) as Mix[]),
      ...byFlavor,
      ...tagResults.flatMap((r) => (r.data ?? []) as Mix[]),
    ]) {
      map.set(m.id, m)
    }
    const merged = [...map.values()].sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0)).slice(0, 40)
    return attachRelations(supabase, merged)
  } catch {
    return []
  }
}

/** フレーバー検索（名前・ブランド）。表記ゆれ吸収。 */
export async function searchFlavors(q: string): Promise<Flavor[]> {
  const variants = likeVariants(q)
  if (variants.length === 0) return []
  try {
    const supabase = await createClient()
    const or = variants.flatMap((v) => [`name.ilike.%${v}%`, `brand.ilike.%${v}%`]).join(',')
    const { data } = await supabase.from('flavors').select('*').or(or).limit(40)
    return (data ?? []) as Flavor[]
  } catch {
    return []
  }
}

/** 全ブランド名（ディレクトリ・sitemap用） */
export async function getBrands(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('flavors').select('brand').limit(2000)
    return [...new Set((data ?? []).map((r) => r.brand as string).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'))
  } catch {
    return []
  }
}

export async function getFlavorById(id: string): Promise<Flavor | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('flavors').select('*').eq('id', id).maybeSingle()
    return (data as Flavor) ?? null
  } catch {
    return null
  }
}

/** フレーバーを図鑑に追加した人（プロ）。added_by が無ければ null（＝運営/初期データ） */
export async function getFlavorAdder(userId: string): Promise<MixAuthor | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_shop, is_pro, shop_name')
      .eq('id', userId)
      .maybeSingle()
    return (data as MixAuthor) ?? null
  } catch {
    return null
  }
}

/** そのフレーバーを使っているミックス（flavor_id 一致、または brand+name 一致） */
export async function getMixesUsingFlavor(flavor: Flavor): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    // brand/name にカンマや括弧が含まれると .or() 構文が壊れて空になるため、
    // 文字列を組み立てず .eq() の2クエリに分けて安全に取得する。
    const [byId, byBrandName] = await Promise.all([
      supabase.from('mix_flavors').select('mix_id').eq('flavor_id', flavor.id),
      supabase.from('mix_flavors').select('mix_id').eq('brand', flavor.brand).eq('name', flavor.name),
    ])
    const ids = [...new Set([...(byId.data ?? []), ...(byBrandName.data ?? [])].map((r) => r.mix_id as string))]
    if (ids.length === 0) return []
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .in('id', ids)
      .order('like_count', { ascending: false })
      .limit(50)
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

/** 味わいタグが重なる関連ミックス（自分を除く） */
export async function getRelatedMixes(mix: Mix, limit = 4): Promise<MixWithRelations[]> {
  try {
    if (!mix.taste_tags || mix.taste_tags.length === 0) return []
    const supabase = await createClient()
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .overlaps('taste_tags', mix.taste_tags)
      .neq('id', mix.id)
      .order('like_count', { ascending: false })
      .limit(limit)
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
  }
}

// ---------- 送客クリックの集計（管理者向け） ----------
export type ClickStats = {
  total: number
  last7: number
  last30: number
  byFlavor: { id: string | null; label: string; count: number }[]
  byDay: { day: string; count: number }[]
}

/** link_clicks を集計。RLS で管理者のみ閲覧可。件数が少ない前提でJS集計。 */
export async function getClickStats(): Promise<ClickStats> {
  const empty: ClickStats = { total: 0, last7: 0, last30: 0, byFlavor: [], byDay: [] }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('link_clicks')
      .select('flavor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5000)
    const rows = (data ?? []) as { flavor_id: string | null; created_at: string }[]
    if (rows.length === 0) return empty

    const now = Date.now()
    const DAY = 86400000
    let last7 = 0
    let last30 = 0
    const flavorCount = new Map<string, number>()
    const dayCount = new Map<string, number>()
    const flavorIds = new Set<string>()
    for (const r of rows) {
      const t = new Date(r.created_at).getTime()
      if (now - t <= 7 * DAY) last7++
      if (now - t <= 30 * DAY) last30++
      if (r.flavor_id) {
        flavorCount.set(r.flavor_id, (flavorCount.get(r.flavor_id) ?? 0) + 1)
        flavorIds.add(r.flavor_id)
      }
      const day = r.created_at.slice(0, 10)
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1)
    }

    // フレーバー名を解決
    const nameById = new Map<string, string>()
    if (flavorIds.size > 0) {
      const { data: fl } = await supabase.from('flavors').select('id, brand, name').in('id', [...flavorIds])
      for (const f of fl ?? []) nameById.set(f.id as string, `${f.brand} ${f.name}`)
    }

    const byFlavor = [...flavorCount.entries()]
      .map(([id, count]) => ({ id, label: nameById.get(id) ?? '（不明なフレーバー）', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    const byDay = [...dayCount.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 14)
      .map(([day, count]) => ({ day, count }))

    return { total: rows.length, last7, last30, byFlavor, byDay }
  } catch {
    return empty
  }
}

/** 図鑑で使われている味わいタグ一覧（フィルタ用） */
export async function getTasteTags(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('mixes').select('taste_tags').limit(500)
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      for (const t of (row.taste_tags as string[]) ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------
// 王道（公式認定）と推薦。source of truth は combo_orthodoxy。
// 既存 national_reps（自動代表）は別物として温存し、混同しない。
// ---------------------------------------------------------------

export type OrthodoxyStatus = {
  /** この作り方が、その組み合わせの公式王道か */
  isOrthodox: boolean
  /** 同じ組み合わせで、別の作り方が王道になっている場合その mix_id */
  otherOrthodoxMixId: string | null
  /** 推薦（運営・認証プロ）の件数 */
  recommendCount: number
  /** 自分が推薦済みか */
  myRecommended: boolean
}

/** ミックス詳細用：公式王道か／推薦されているか。 */
export async function getOrthodoxyStatus(mix: { id: string; combo_key: string }): Promise<OrthodoxyStatus> {
  const empty: OrthodoxyStatus = { isOrthodox: false, otherOrthodoxMixId: null, recommendCount: 0, myRecommended: false }
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const [orthoRes, recRes, mineRes] = await Promise.all([
      supabase.from('combo_orthodoxy').select('mix_id').eq('combo_key', mix.combo_key).maybeSingle(),
      supabase.from('method_recommendations').select('id', { count: 'exact', head: true }).eq('mix_id', mix.id),
      user
        ? supabase
            .from('method_recommendations')
            .select('id')
            .eq('mix_id', mix.id)
            .eq('proposed_by', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const orthodoxMixId = (orthoRes.data as { mix_id: string } | null)?.mix_id ?? null
    return {
      isOrthodox: orthodoxMixId === mix.id,
      otherOrthodoxMixId: orthodoxMixId && orthodoxMixId !== mix.id ? orthodoxMixId : null,
      recommendCount: recRes.count ?? 0,
      myRecommended: !!mineRes.data,
    }
  } catch {
    return empty
  }
}

/** 管理画面用：推薦された作り方の一覧（王道認定の候補）。 */
export type RecommendedMethod = {
  mix: MixWithRelations
  recommendCount: number
  isOrthodox: boolean
}

export async function getRecommendedMethods(): Promise<RecommendedMethod[]> {
  try {
    const supabase = await createClient()
    const { data: recRows } = await supabase.from('method_recommendations').select('mix_id').limit(500)
    const counts = new Map<string, number>()
    for (const r of (recRows ?? []) as { mix_id: string }[]) {
      counts.set(r.mix_id, (counts.get(r.mix_id) ?? 0) + 1)
    }
    if (counts.size === 0) return []
    const { data: mixRows } = await supabase.from('mixes').select('*').in('id', [...counts.keys()])
    const mixes = await attachRelations(supabase, (mixRows ?? []) as Mix[])
    const { data: orthoRows } = await supabase
      .from('combo_orthodoxy')
      .select('mix_id')
      .in('combo_key', [...new Set(mixes.map((m) => m.combo_key))])
    const orthodox = new Set(((orthoRows ?? []) as { mix_id: string }[]).map((o) => o.mix_id))
    return mixes
      .map((m) => ({ mix: m, recommendCount: counts.get(m.id) ?? 0, isOrthodox: orthodox.has(m.id) }))
      .sort((a, b) => b.recommendCount - a.recommendCount)
  } catch {
    return []
  }
}
