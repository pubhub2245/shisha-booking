import Link from 'next/link'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'

export const metadata = {
  title: '煙道 ENDOH について',
  description: '煙道（ENDOH）は「日本人に美味しい」シーシャをみんなで選び育てる、日本代表シーシャ図鑑です。',
}

const features: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  { icon: '🇯🇵', preset: 'amber', title: '日本代表シーシャ図鑑', body: '系統ごとに、みんなの👍と「作った！」で最も支持されたミックスを「日本代表」に選出。日本の"美味しい"の基準を可視化する。' },
  { icon: '📖', preset: 'green', title: 'ミックス図鑑', body: 'フレーバーの組み合わせを検索・閲覧。気分から「吸いたいミックス」が見つかる。' },
  { icon: '🔥', preset: 'amber', title: '作り方ノート', body: '熱管理カーブや炭のセットアップ、フレーバーの置き方まで。作り手のノウハウを共有できる。' },
  { icon: '🛒', preset: 'violet', title: 'そのまま買える', body: '使用フレーバーに購入リンク。気になったらすぐ手に入れて、自分でも作れる。' },
  { icon: '🏠', preset: 'blue', title: '店舗も参加', body: 'お店として登録すれば、あなたのミックスがファンに届き、来店のきっかけに。' },
]

export default function AboutPage() {
  return (
    <div className="wrap max-w-2xl py-14">
      <p className="eyebrow">About 煙道 ENDOH</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
        「日本人に美味しい」を、<br />みんなで作る。<span className="ember-text">日本代表シーシャ図鑑。</span>
      </h1>
      <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        <b>煙道（えんどう / ENDOH）</b>とは、煙の通り道のこと。茶道・華道・香道に連なる“道”として、
        日本流に洗練されたシーシャの作法を集めます。本場の作り方はあっても、「日本人の舌に美味しいシーシャの標準」は世界のどこにもありません。
        煙道は、その基準を作り手みんなで選び・磨いていく図鑑です。系統ごとに最も支持されたミックスが「日本代表」に選ばれ、
        シーシャ屋で迷ったとき「まずこれ」と言える鉄板が見つかる場所を目指します。
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
        <h2 className="text-xl" style={{ fontWeight: 700 }}>あなたのミックスも、日本代表に。</h2>
        <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
          いまは立ち上げ期。最初の作り手＝<b>創設メンバー</b>を募集しています。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/founders" className="btn btn-ember">創設メンバーになる</Link>
          <Link href="/" className="btn btn-ghost">図鑑を見る</Link>
        </div>
      </div>
    </div>
  )
}
