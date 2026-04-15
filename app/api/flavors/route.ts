import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 60

export async function GET() {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('flavors')
    .select('id, name, stock')
    .gt('stock', 0)
    .order('name')

  if (error) {
    console.error('[api/flavors]', error)
    return NextResponse.json([])
  }

  return NextResponse.json(data || [])
}
