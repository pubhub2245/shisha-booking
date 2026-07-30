import { createClient } from '@/lib/supabase/server'
import { comboKey, comboSlug, comboKeyFromSlug } from '@/lib/combo'
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
} from '@/lib/types/database'

export type FeedOptions = {
  sort?: 'new' | 'popular'
  tags?: string[]
  strength?: 'light' | 'medium' | 'strong'
  q?: string
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
      const term = `%${opts.q.trim()}%`
      query = query.or(`title.ilike.${term},description.ilike.${term}`)
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

/** フィード用：ミックス（作り方）を Combo（組み合わせ）単位にまとめる */
export async function getCombos(opts: FeedOptions = {}): Promise<ComboSummary[]> {
  const mixes = await getMixes(opts)
  const groups = new Map<string, MixWithRelations[]>()
  for (const m of mixes) {
    const key = m.combo_key || comboKey(m.mix_flavors ?? [])
    const arr = groups.get(key) ?? []
    arr.push(m)
    groups.set(key, arr)
  }

  const combos: ComboSummary[] = []
  for (const [key, methods] of groups) {
    methods.sort((a, b) => b.like_count - a.like_count || (a.created_at < b.created_at ? 1 : -1))
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
      tags: [...tagSet].slice(0, 3),
      top,
      latest,
    })
  }

  combos.sort((a, b) =>
    opts.sort === 'popular' ? b.totalLikes - a.totalLikes : a.latest < b.latest ? 1 : -1
  )
  return combos
}

/** Combo 詳細：その組み合わせの全ての作り方（Method） */
export async function getComboBySlug(
  slug: string
): Promise<{ key: string; flavorNames: string[]; methods: MixWithRelations[] } | null> {
  try {
    const key = comboKeyFromSlug(slug)
    const supabase = await createClient()
    const { data } = await supabase
      .from('mixes')
      .select('*')
      .eq('combo_key', key)
      .order('like_count', { ascending: false })
    const mixes = (data ?? []) as Mix[]
    if (mixes.length === 0) return null
    const methods = await attachRelations(supabase, mixes)
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

// ---------- 店舗 ----------
export async function getShops(): Promise<(Profile & { mix_count: number })[]> {
  try {
    const supabase = await createClient()
    const { data: shops } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_shop', true)
      .order('created_at', { ascending: false })
    const list = (shops ?? []) as Profile[]
    if (list.length === 0) return []
    const { data: mixes } = await supabase.from('mixes').select('author_id').in('author_id', list.map((s) => s.id))
    const counts = new Map<string, number>()
    for (const m of mixes ?? []) {
      const a = m.author_id as string | null
      if (a) counts.set(a, (counts.get(a) ?? 0) + 1)
    }
    return list.map((s) => ({ ...s, mix_count: counts.get(s.id) ?? 0 }))
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

export async function getFlavorById(id: string): Promise<Flavor | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('flavors').select('*').eq('id', id).maybeSingle()
    return (data as Flavor) ?? null
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
