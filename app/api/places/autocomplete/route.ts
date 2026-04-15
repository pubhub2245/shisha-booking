import { NextResponse } from 'next/server'

export const revalidate = 0

// Google Places API (New) Autocomplete のサーバープロキシ。
// API キーをブラウザに露出しないために、すべてサーバー経由で発行する。
// 必要 env: GOOGLE_PLACES_API_KEY
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ predictions: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ predictions: [] })

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: q,
        languageCode: 'ja',
        regionCode: 'jp',
        includedPrimaryTypes: ['establishment'],
      }),
    })
    if (!res.ok) {
      console.error('[places/autocomplete] upstream error:', res.status)
      return NextResponse.json({ predictions: [] })
    }
    const data = (await res.json()) as {
      suggestions?: Array<{ placePrediction?: { placeId: string; text?: { text: string } } }>
    }
    const predictions = (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text?: { text: string } } => !!p)
      .map((p) => ({ place_id: p.placeId, description: p.text?.text ?? '' }))
    return NextResponse.json({ predictions })
  } catch (e) {
    console.error('[places/autocomplete] exception:', e)
    return NextResponse.json({ predictions: [] })
  }
}
