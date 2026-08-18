import type { MetadataRoute } from 'next'
import { BRAND, BRAND_TITLE } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_TITLE,
    short_name: BRAND.full,
    description: `1つのフレーバーを、どう作るか。実際に作られた作り方を試して、比べられます。`,
    start_url: '/',
    display: 'standalone',
    background_color: '#f3ede1',
    theme_color: '#f3ede1',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
    ],
  }
}
