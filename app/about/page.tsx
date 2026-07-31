import Link from 'next/link'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'

export const metadata = {
  title: 'MixHub について',
  description: 'MixHub は、日本のシーシャの「美味しい」ミックスと作り方が集まる図鑑コミュニティです。',
}

const features: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  { icon: '📖', preset: 'green', title: 'ミックス図鑑', body: 'フレーバーの組み合わせを検索・閲覧。気分から「吸いたいミックス」が見つかる。' },
  { icon: '❤️', preset: 'amber', title: 'いいねで人気が可視化', body: '誰でも投稿でき、いいねが集まると人気ミックスに。みんなの「美味しい」が基準になる。' },
  { icon: '🔥', preset: 'amber', title: '作り方ノート', body: '熱管理カーブや炭のセットアップ、フレーバーの置き方まで。作り手のノウハウを共有できる。' },
  { icon: '🛒', preset: 'violet', title: 'そのまま買える', body: '使用フレーバーに購入リンク。気になったらすぐ手に入れて、自分でも作れる。' },
  { icon: '🏠', preset: 'blue', title: '店舗も参加', body: 'お店として登録すれば、あなたのミックスがファンに届き、来店のきっかけに。' },
]

export default function AboutPage() {
  return (
    <div className="wrap max-w-2xl py-14">
      <p className="eyebrow">About MixHub</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
        シーシャの「美味しい」を、<br />みんなで育てる図鑑。
      </h1>
      <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        シーシャ屋で「どのフレーバーにしよう」と迷った経験はありませんか？ MixHub は、日本中の美味しいミックスと、
        その作り方が集まる図鑑コミュニティです。シーシャにはまだ明確な「正解の作り方」がありません。
        みんなの投稿といいねで、日本の“美味しいシーシャの作り方”の基準をつくっていきます。
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {features.map((f) => (
          <div key={f.title} className="card flex items-center gap-4 p-5">
            <IconOrb preset={f.preset} size={50}>{f.icon}</IconOrb>
            <div>
              <h2 className="text-base" style={{ fontWeight: 700 }}>{f.title}</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>あなたのミックスも、図鑑に。</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-ember">無料で始める</Link>
          <Link href="/" className="btn btn-ghost">図鑑を見る</Link>
        </div>
      </div>
    </div>
  )
}
