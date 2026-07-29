import Link from 'next/link'

export const metadata = { title: '店舗の方へ — MixHub' }

const benefits = [
  {
    icon: '🎯',
    title: '指名で選ばれる',
    body: '「このお店のミックスが吸いたい」を作る。お店のレシピが図鑑に載り、ファンが増えます。',
  },
  {
    icon: '📈',
    title: '集客につながる',
    body: '人気ミックスの発信元としてエリア・SNSリンクを掲載。来店の動機を生み出します。',
  },
  {
    icon: '📖',
    title: 'ノウハウが資産に',
    body: '作り方ノートを蓄積。将来的にはレシピ・ノウハウの販売で新たな収益も。',
  },
]

export default function ForShops() {
  return (
    <div className="wrap max-w-3xl py-14">
      <p className="eyebrow">For shops</p>
      <h1 className="mt-3 text-4xl leading-tight" style={{ fontWeight: 800 }}>
        あなたのお店の一杯を、<span className="ember-text">指名される味に。</span>
      </h1>
      <p className="mt-4 text-base" style={{ color: 'var(--color-ash)' }}>
        MixHub は、シーシャのミックスと作り方が集まる図鑑です。店舗として登録すると、
        あなたのお店のミックスがファンに届き、来店のきっかけになります。
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="card p-6">
            <div className="text-2xl">{b.icon}</div>
            <h3 className="mt-3 text-base" style={{ fontWeight: 700 }}>{b.title}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>{b.body}</p>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>登録は無料。まずはアカウントから。</h2>
        <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
          アカウント作成後、マイページの「店舗として登録する」をオンにするだけ。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-ember">無料で始める</Link>
          <Link href="/mypage" className="btn btn-ghost">店舗登録へ</Link>
        </div>
      </div>
    </div>
  )
}
