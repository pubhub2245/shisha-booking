import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { BRAND } from '@/lib/site'

export const alt = `${BRAND.full} — ${BRAND.category}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 煙道 = 「煙の通り道」。和（washi × 墨 × 苔緑 × 朱の落款）の意匠で、
// 王道シーシャ図鑑を表現する既定OG画像。
export default async function OpengraphImage() {
  const jp = await readFile(new URL('./brand-jp.ttf', import.meta.url))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 84px',
          background: 'linear-gradient(150deg, #f3ede1 0%, #efe7d8 55%, #ece3d1 100%)',
          color: '#201e18',
          fontFamily: 'BrandJP',
        }}
      >
        {/* ヘッダー：朱の落款＋ワードマーク */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 88,
              height: 88,
              borderRadius: 14,
              background: '#b23b2e',
              color: '#fbf8f0',
              fontSize: 54,
              boxShadow: '0 6px 16px -6px rgba(178,59,46,0.55)',
            }}
          >
            {BRAND.mark}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2 }}>{BRAND.name}</div>
            <div style={{ fontSize: 20, letterSpacing: 10, color: '#2f6147' }}>{BRAND.nameEn}</div>
          </div>
        </div>

        {/* 主コピー */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 38, color: '#2f6147', letterSpacing: 6 }}>{BRAND.tagline}</div>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.15, fontWeight: 700 }}>
            日本人に美味しいを、
          </div>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.15, fontWeight: 700, color: '#3f7d5f' }}>
            みんなで作る。
          </div>
        </div>

        {/* フッター：カテゴリ */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 30px',
              borderRadius: 999,
              background: '#fbf8f0',
              border: '2px solid rgba(63,125,95,0.35)',
              fontSize: 30,
              color: '#201e18',
            }}
          >
            {BRAND.category}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'BrandJP', data: jp, style: 'normal', weight: 700 }],
    }
  )
}
