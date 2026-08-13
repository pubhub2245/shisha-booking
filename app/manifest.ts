import type { MetadataRoute } from 'next'
import { BRAND, BRAND_TITLE } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_TITLE,
    short_name: BRAND.full,
    description: `日本中の「美味しい」シーシャ ミックスと作り方が集まる${BRAND.category}コミュニティ。`,
    start_url: '/',
    display: 'standalone',
    background_color: '#f3ede1',
    theme_color: '#f3ede1',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
    ],
  }
}
