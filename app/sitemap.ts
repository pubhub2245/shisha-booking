import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/flavors', '/ranking', '/about', '/for-shops', '/signup',
  ].map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'daily', priority: path === '' ? 1 : 0.6 }))

  try {
    const supabase = await createClient()
    const [{ data: mixes }, { data: flavors }] = await Promise.all([
      supabase.from('mixes').select('id, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('flavors').select('id').limit(1000),
    ])
    const mixRoutes: MetadataRoute.Sitemap = (mixes ?? []).map((m) => ({
      url: `${SITE_URL}/mix/${m.id}`,
      lastModified: m.created_at as string,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
    const flavorRoutes: MetadataRoute.Sitemap = (flavors ?? []).map((f) => ({
      url: `${SITE_URL}/flavor/${f.id}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
    return [...staticRoutes, ...mixRoutes, ...flavorRoutes]
  } catch {
    return staticRoutes
  }
}
