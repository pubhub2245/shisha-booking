import { createClient } from '@/lib/supabase/server'
import type { MixWithRelations } from '@/lib/types/database'

const MIX_SELECT =
  '*, author:profiles(id, username, display_name, is_shop, shop_name), mix_flavors(*)'

export type FeedOptions = {
  sort?: 'new' | 'popular'
  tag?: string
  q?: string
}

/** 図鑑フィード。DB 未接続・エラー時は空配列で穏当に返す。 */
export async function getMixes(opts: FeedOptions = {}): Promise<MixWithRelations[]> {
  try {
    const supabase = await createClient()
    let query = supabase.from('mixes').select(MIX_SELECT)

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
    return sortFlavors((data ?? []) as MixWithRelations[])
  } catch (e) {
    console.error('[getMixes] fatal', e)
    return []
  }
}

export async function getMixById(id: string): Promise<MixWithRelations | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('mixes').select(MIX_SELECT).eq('id', id).maybeSingle()
    if (error || !data) return null
    return sortFlavors([data as MixWithRelations])[0] ?? null
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
      .select(MIX_SELECT)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
    if (error) return []
    return sortFlavors((data ?? []) as MixWithRelations[])
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

function sortFlavors(mixes: MixWithRelations[]): MixWithRelations[] {
  for (const m of mixes) {
    if (Array.isArray(m.mix_flavors)) {
      m.mix_flavors.sort((a, b) => a.position - b.position)
    }
  }
  return mixes
}
