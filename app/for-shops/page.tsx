import Link from 'next/link'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'

export const metadata = { title: '店舗の方へ — MixHub' }

const benefits: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  {
    icon: '🎯',
    preset: 'green',
    title: '指名で選ばれる',
    body: '「このお店のミックスが吸いたい」を作る。お店のレシピが図鑑に載り、ファンが増えます。',
  },
  {
    icon: '📈',
    preset: 'amber',
    title: '集客につながる',
    body: '人気ミックスの発信元としてエリア・SNSリンクを掲載。来店の動機を生み出します。',
  },
  {
    icon: '📖',
    preset: 'violet',
    title: 'ノウハウが資産に',
    body: '作り方ノートを蓄積。将来的にはレシピ・ノウハウの販売で新たな収益も。',
  },
  {
    icon: '🫙',
    preset: 'green',
    title: '在庫棚で来店を生む',
    body: '今ある（吸える）フレーバーを登録。「このお店ならこれが吸える」で、フレーバー検索から来店につながります。',
  },
  {
    icon: '📱',
    preset: 'amber',
    title: '店頭QRがメニュー表に',
    body: 'QRを置くだけで、お客さんはスマホで今日の在庫を閲覧。更新すればそのまま在庫管理にもなります。',
  },
]

export default function ForShops() {
  return (
    <div className="wrap max-w-3xl py-14">
      <p className="eyebrow">For shops</p>
      <h1 className="mt-3 text-4xl leading-tight" style={{ fontWeight: 800 }}>
        あなたのお店の一台を、<span className="ember-text">指名される味に。</span>
      </h1>
      <p className="mt-4 text-base" style={{ color: 'var(--color-ash)' }}>
        MixHub は「日本代表シーシャ図鑑」。店舗として登録すると、あなたのお店のミックスがファンに届き、
        来店のきっかけになります。人気ミックスは系統ごとの「日本代表」に選ばれ、指名需要につながります。
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        個人の作り手（スタッフ）としての参加は{' '}
        <Link href="/founders" className="hover:underline" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          創設メンバー募集
        </Link>
        {' '}もご覧ください。
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="card p-6">
            <IconOrb preset={b.preset} size={52}>{b.icon}</IconOrb>
            <h3 className="mt-4 text-base" style={{ fontWeight: 700 }}>{b.title}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>{b.body}</p>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>登録は無料。まずはアカウントから。</h2>
        <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
          アカウント作成後、「お店を登録」からお店を作成。あなたがオーナーになり、他のスタッフも参加申請 → 承認で紐付けられます。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-ember">無料で始める</Link>
          <Link href="/shop/new" className="btn btn-ghost">お店を登録する</Link>
        </div>
      </div>
    </div>
  )
}
