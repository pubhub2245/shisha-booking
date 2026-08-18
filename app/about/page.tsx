import Link from 'next/link'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'

export const metadata = {
  title: '煙道 ENDO について',
  description: '煙道（ENDO）は、1つのフレーバーをどう作るかを、みんなで試して比べる場所です。',
}

const features: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  { icon: '試', preset: 'amber', title: '他人の作り方を試す', body: 'いつもの一台を、誰かのやり方に置き換えてみる。同じフレーバーでも、ボウル・詰め方・HMD・炭・火入れで一台は変わる。' },
  { icon: '図', preset: 'green', title: 'フレーバー図鑑', body: 'フレーバーごとに、実際に作られた作り方が並ぶ。今夜の一台がここで決まる。' },
  { icon: '比', preset: 'amber', title: '前の一台と比べる', body: '作ったら「前に作ったあれと比べてどうだったか」を残す。あなたの舌の中での比較が、そのまま蓄積される。' },
  { icon: '技', preset: 'green', title: '作り方ノート', body: '熱管理カーブや炭のセットアップ、フレーバーの置き方まで。作り手が何を狙っているかまで残せる。' },
  { icon: '代', preset: 'violet', title: '王道', body: '実際に作られ、吸われ、比べられた作り方の中から、煙道が確認して認定する。投稿数やいいねでは決まらない。' },
  { icon: '店', preset: 'blue', title: '店舗も参加', body: 'お店として登録すれば、あなたの作り方が届き、来店のきっかけに。' },
]

export default function AboutPage() {
  return (
    <div className="wrap max-w-2xl py-14">
      <p className="eyebrow">About 煙道 ENDO</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
        1つのフレーバーを、<br />どう作るか。<span className="ember-text">みんなで擦る。</span>
      </h1>
      <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        <b><ruby>煙道<rt>えんどう</rt></ruby>（ENDO）</b>とは、煙の通り道のこと。茶道・華道・香道に連なる“道”として、
        日本流に洗練されたシーシャの作法を集めます。
        煙道が扱うのは、フレーバーの組み合わせではありません。<b>1つのフレーバーを、どう作るか</b>だけです。
        フレーバーを固定すれば、残る変数はボウル・詰め方・HMD・立ち上げの炭・初期加熱の5つ。
        だから「何が味を変えたのか」が分かります。
        同じフレーバーを、多くの人が違うやり方で作り、吸い、記録し、前の一台と比べる。
        その蓄積の中から<span className="bouten">王道</span>を煙道が確認・認定します。投稿数やいいねでは決まりません。
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {features.map((f) => (
          <div key={f.title} className="card card-wa flex items-center gap-4 p-5">
            <IconOrb preset={f.preset} size={50}><span className="font-display" style={{ fontWeight: 700 }}>{f.icon}</span></IconOrb>
            <div>
              <h2 className="text-base" style={{ fontWeight: 700 }}>{f.title}</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>あなたの作り方も、王道に。</h2>
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
