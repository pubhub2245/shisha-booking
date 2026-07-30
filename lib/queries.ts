import { createClient } from '@/lib/supabase/server'
import type {
  MixWithRelations,
  Mix,
  MixFlavor,
  MixAuthor,
  CommentWithAuthor,
  Comment,
  Profile,
  Flavor,
} from '@/lib/types/database'

export type FeedOptions = {
  sort?: 'new' | 'popular'
  tag?: string
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

    if (opts.tag) query = query.contains('taste_tags', [opts.tag])
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
