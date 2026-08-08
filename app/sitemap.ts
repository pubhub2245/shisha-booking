import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { comboSlug } from '@/lib/combo'
import { BOWL_OPTIONS, HMS_OPTIONS } from '@/lib/heat'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shisha-booking.vercel.app'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/flavors', '/ranking', '/guide', '/search', '/about', '/for-shops', '/shops', '/signup',
    ...BOWL_OPTIONS.filter((o) => o.v !== 'other').map((o) => `/bowl/${o.v}`),
    ...HMS_OPTIONS.filter((o) => o.v !== 'other').map((o) => `/hms/${o.v}`),
  ].map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'daily', priority: path === '' ? 1 : 0.6 }))

  try {
    const supabase = await createClient()
    const [{ data: mixes }, { data: flavors }, { data: combos }, { data: shops }, { data: brandRows }] = await Promise.all([
      supabase.from('mixes').select('id, created_at, combo_key').order('created_at', { ascending: false }).limit(1000),
      supabase.from('flavors').select('id').limit(1000),
      supabase.from('mixes').select('combo_key').limit(1000),
      supabase.from('shops').select('id').limit(1000),
      supabase.from('flavors').select('brand').limit(2000),
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
    const comboKeys = [...new Set((combos ?? []).map((c) => c.combo_key as string).filter(Boolean))]
    const comboRoutes: MetadataRoute.Sitemap = comboKeys.map((key) => ({
      url: `${SITE_URL}/combo/${comboSlug(key)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
    const shopRoutes: MetadataRoute.Sitemap = (shops ?? []).map((s) => ({
      url: `${SITE_URL}/shop/${s.id}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
    const brands = [...new Set((brandRows ?? []).map((b) => b.brand as string).filter(Boolean))]
    const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
      url: `${SITE_URL}/brand/${encodeURIComponent(b)}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
    return [...staticRoutes, ...mixRoutes, ...flavorRoutes, ...comboRoutes, ...shopRoutes, ...brandRoutes]
  } catch {
    return staticRoutes
  }
}
