import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const area = searchParams.get('area') || ''

  const supabase = await createClient()
  let query = supabase.from('bars').select('id, name, address, area').order('name')

  if (area) query = query.eq('area', area)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data } = await query.limit(10)
  return NextResponse.json(data || [])
}
