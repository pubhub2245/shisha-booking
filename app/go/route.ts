import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAffiliateTag } from '@/lib/affiliate'

export const dynamic = 'force-dynamic'

/**
 * 送客リンクの計測リダイレクタ。
 *   /go?u=<購入/来店URL>&f=<flavor_id>&m=<mix_id>&s=<shop_id>
 * クリックを best-effort で記録し、アフィリエイトタグを付与して 302 リダイレクトする。
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = new URL(request.url)
  const raw = searchParams.get('u')

  // http(s) のみ許可（オープンリダイレクト対策）
  let target: URL | null = null
  try {
    if (raw) {
      const u = new URL(raw)
      if (u.protocol === 'http:' || u.protocol === 'https:') target = u
    }
  } catch {
    target = null
  }
  if (!target) return NextResponse.redirect(origin)

  const tagged = withAffiliateTag(target.toString()) ?? target.toString()

  // クリック記録（失敗しても遷移は止めない）
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('link_clicks').insert({
      user_id: user?.id ?? null,
      flavor_id: searchParams.get('f') || null,
      mix_id: searchParams.get('m') || null,
      shop_id: searchParams.get('s') || null,
      target: tagged,
    })
  } catch {
    // no-op
  }

  return NextResponse.redirect(tagged)
}
