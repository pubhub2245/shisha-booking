import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { BRAND } from '@/lib/site'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// 朱の落款に白抜きの「煙」。和の意匠（washi × 朱の落款）に合わせる。
export default async function Icon() {
  // フォント読み込み失敗でアイコン配信が 500 にならないよう、失敗時はシステムフォントにフォールバック
  let jp: Buffer | null = null
  try {
    jp = await readFile(new URL('./brand-jp.ttf', import.meta.url))
  } catch {
    jp = null
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#b23b2e',
          color: '#fbf8f0',
          fontSize: 42,
          fontFamily: 'BrandJP',
        }}
      >
        {BRAND.mark}
      </div>
    ),
    {
      ...size,
      fonts: jp ? [{ name: 'BrandJP', data: jp, style: 'normal', weight: 700 }] : [],
    }
  )
}
