import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getMixById, getFlavors } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixForm, type MixFormInitial } from '@/components/mix-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ミックスを編集 — MixHub' }

export default async function EditMixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [mix, user, flavors] = await Promise.all([getMixById(id), getCurrentUser(), getFlavors()])
  if (!mix) notFound()
  if (!user) redirect(`/login?next=/mix/${id}/edit`)
  if (user.id !== mix.author_id) redirect(`/mix/${id}`)

  const initial: MixFormInitial = {
    title: mix.title,
    description: mix.description ?? '',
    strength: mix.strength,
    tasteTags: mix.taste_tags.join(', '),
    heat: mix.heat_management ?? '',
    heatCurve: mix.heat_curve,
    placement: mix.placement_note ?? '',
    flavors: (mix.mix_flavors ?? []).map((f) => ({
      flavorId: f.flavor_id ?? '',
      name: f.name,
      brand: f.brand ?? '',
      ratio: f.ratio != null ? String(f.ratio) : '',
      url: f.affiliate_url ?? '',
    })),
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <Link href={`/mix/${id}`} className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        ← ミックスにもどる
      </Link>
      <h1 className="mt-4 text-3xl" style={{ fontWeight: 800 }}>
        ミックスを編集
      </h1>
      <MixForm mode="edit" mixId={id} initial={initial} flavors={flavors} />
    </div>
  )
}
