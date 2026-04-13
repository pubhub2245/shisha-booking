import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zjdxhvggsqxscblmfutw.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHhodmdnc3F4c2NibG1mdXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODYwOTMsImV4cCI6MjA5MTY2MjA5M30.ymHM3oo1F1h23e4tgSojcDZHE17cpf-Opx3-9ElrHHk'

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/areas?is_active=eq.true&order=created_at&select=id,label,max_units`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) return NextResponse.json([])

    const data = await res.json()
    return NextResponse.json(
      (data || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        label: a.label,
        max_units: typeof a.max_units === 'number' ? a.max_units : 0,
      }))
    )
  } catch {
    return NextResponse.json([])
  }
}
