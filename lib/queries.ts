import { createClient } from '@/lib/supabase/server'
import { comboKey, comboSlug, comboKeyFromSlug, flavorKey } from '@/lib/combo'
import { mixQuality, mixCompleteness } from '@/lib/quality'
import type {
  MixWithRelations,
  Mix,
  MixFlavor,
  MixAuthor,
  CommentWithAuthor,
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
async function attachRelations(
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
    let query = supabase.from('mixes').select('*')

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
    const [withRel] = await attachRelations(supabase, [data as Mix])
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
    if (error) return []
    return attachRelations(supabase, (data ?? []) as Mix[])
  } catch {
    return []
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
export async function getMixComments(mixId: string): Promise<CommentWithAuthor[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('mix_id', mixId)
      .order('created_at', { ascending: true })
    const comments = (data ?? []) as Comment[]
    if (comments.length === 0) return []
    const authorIds = [...new Set(comments.map((c) => c.user_id))]
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_shop, is_pro, shop_name')
      .in('id', authorIds)
    const byId = new Map<string, MixAuthor>()
    for (const a of (authors ?? []) as MixAuthor[]) byId.set(a.id, a)
    return comments.map((c) => ({ ...c, author: byId.get(c.user_id) ?? null }))
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
    const { data: mf } = await supabase
      .from('mix_flavors')
      .select('mix_id, flavor_id, brand, name')
      .or(`flavor_id.eq.${flavor.id},and(brand.eq.${flavor.brand},name.eq.${flavor.name})`)
    const ids = [...new Set((mf ?? []).map((r) => r.mix_id as string))]
    if (ids.length === 0) return []
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .in('id', ids)
      .order('like_count', { ascending: false })
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
