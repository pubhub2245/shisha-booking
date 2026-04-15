import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 60

export async function GET() {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('areas')
    .select('id, label, max_units')
    .eq('is_active', true)
    .order('created_at')

  if (error) {
    console.error('[api/areas]', error)
    return NextResponse.json([])
  }

  return NextResponse.json(
    (data || []).map((a) => ({
      id: a.id,
      label: a.label,
      max_units: typeof a.max_units === 'number' ? a.max_units : 0,
    }))
  )
}
