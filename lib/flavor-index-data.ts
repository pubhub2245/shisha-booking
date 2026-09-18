/**
 * 味の系統別まとめ／似た味の索引を、実データから1回で作る。
 *
 * ページごとに個別に問い合わせると同じ表を何度も読むことになるので、
 * 索引はまとめて作って各ページで絞り込む。DB が読めないときは空を返し、
 * 呼び出し側は「作れる組み合わせが無い」として扱う（画面は落とさない）。
 */

import { createClient } from '@/lib/supabase/server'
import { buildFlavorIndex, type IndexedFlavor, type MethodRow, type MethodFlavorLink } from '@/lib/flavor-index'

export async function getFlavorIndex(): Promise<IndexedFlavor[]> {
  try {
    const supabase = await createClient()
    const [{ data: flavors }, { data: mixes }, { data: links }, madeRes] = await Promise.all([
      supabase.from('flavors').select('id, brand, name').limit(2000),
      // 旧モデルの複数フレーバー記録は hidden=true で下げてあるので自然に除かれる
      supabase.from('mixes').select('id, taste_tags, like_count').eq('hidden', false).limit(2000),
      supabase.from('mix_flavors').select('mix_id, flavor_id').limit(4000),
      supabase.rpc('mix_made_counts'),
    ])

    const makerByMix = new Map<string, number>()
    for (const r of (madeRes?.data ?? []) as { mix_id: string; maker_count: number }[]) {
      makerByMix.set(r.mix_id, r.maker_count ?? 0)
    }

    const methods: MethodRow[] = ((mixes ?? []) as MethodRow[]).map((m) => ({
      ...m,
      maker_count: makerByMix.get(m.id) ?? 0,
    }))
    const methodLinks: MethodFlavorLink[] = ((links ?? []) as { mix_id: string; flavor_id: string | null }[])
      .filter((l): l is MethodFlavorLink => !!l.flavor_id)

    return buildFlavorIndex((flavors ?? []) as { id: string; brand: string; name: string }[], methods, methodLinks)
  } catch {
    return []
  }
}
