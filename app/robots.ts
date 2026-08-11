import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/mypage', '/post', '/api'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
