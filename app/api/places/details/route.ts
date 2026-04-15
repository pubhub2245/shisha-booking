import { NextResponse } from 'next/server'

export const revalidate = 0

// place_id から名称・住所を取得する Place Details プロキシ。
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('place_id')?.trim() ?? ''
  if (!placeId) return NextResponse.json({})

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({})

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress',
      },
    })
    if (!res.ok) return NextResponse.json({})
    const data = (await res.json()) as {
      displayName?: { text?: string }
      formattedAddress?: string
    }
    return NextResponse.json({
      name: data.displayName?.text ?? '',
      address: data.formattedAddress ?? '',
    })
  } catch {
    return NextResponse.json({})
  }
}
