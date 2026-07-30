import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MixHub — シーシャ ミックス図鑑',
    short_name: 'MixHub',
    description: '日本中の「美味しい」シーシャ ミックスと作り方が集まる図鑑コミュニティ。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f4ee',
    theme_color: '#f7f4ee',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
    ],
  }
}
