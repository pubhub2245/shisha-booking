import Link from 'next/link'
import type { Metadata } from 'next'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'

export const metadata: Metadata = {
  title: '創設メンバー募集',
  description:
    '日本のシーシャに、まだ「美味しい作り方」の標準はありません。その基準を最初に作る側になりませんか。煙道 創設メンバー（作り手）を募集しています。',
}

const perks: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  {
    icon: '王',
    preset: 'amber',
    title: '「王道」の冠を最初に獲れる',
    body: '実際に吸われ、再現された作り方を煙道が確認して王道に認定します。人が少ない今こそ、あなたの作り方が王道になる最短のタイミングです。',
  },
  {
    icon: '🎖️',
    preset: 'violet',
    title: '創設メンバーの証',
    body: '初期に参加した作り手には「創設メンバー」バッジが付きます。この図鑑を最初に作った一人として、ずっと記録に残ります。',
  },
  {
    icon: '📖',
    preset: 'green',
    title: 'あなたの作品集になる',
    body: 'プロフィールが実績付きの作品集に。累計いいね・作られた回数・王道の冠が数字で残り、あなたの腕の証明になります。',
  },
  {
    icon: '🏠',
    preset: 'blue',
    title: 'お店への送客',
    body: '店舗を登録すれば、あなたの作り方から来店動機が生まれます。在庫棚・店頭QRメニューで「この店ならこれが吸える」を可視化。',
  },
]

const steps: { n: string; title: string; body: string }[] = [
  { n: '1', title: 'アカウント登録', body: 'メールとパスワードだけ。1分で完了します。' },
  { n: '2', title: 'お店を紐付け（任意）', body: 'お店を登録してオーナーに。スタッフは参加申請 → 承認で紐付け。' },
  { n: '3', title: 'プロ申請 → 最初の作り方を登録', body: 'SNSと在籍店で申請、運営が確認して認証。あとは自慢の作り方を1つ登録するだけ。' },
]

export default function FoundersPage() {
  return (
    <div className="wrap max-w-3xl py-14">
      <p className="eyebrow">Founding Members</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
        日本のシーシャの<span className="ember-text">「基準」</span>を、<br />最初に作る側になりませんか。
      </h1>
      <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        本場（中東・欧米）の作り方はあっても、<b>「日本人の舌に美味しいシーシャの標準」は世界のどこにもありません</b>。
        煙道 は、その基準を作り手みんなで選び・磨いていく「王道シーシャ図鑑」です。
        いまはまだ立ち上げ期。だからこそ、<b>最初の作り手＝創設メンバー</b>には、後から入る人には得られない場所があります。
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {perks.map((p) => (
          <div key={p.title} className="card p-6">
            <IconOrb preset={p.preset} size={52}>{p.icon}</IconOrb>
            <h3 className="mt-4 text-base" style={{ fontWeight: 700 }}>{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{p.body}</p>
          </div>
        ))}
      </div>

      {/* 参加の流れ */}
      <h2 className="mt-14 text-2xl" style={{ fontWeight: 800 }}>参加の流れ</h2>
      <div className="mt-6 flex flex-col gap-4">
        {steps.map((s) => (
          <div key={s.n} className="card flex items-start gap-4 p-5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm"
              style={{ background: 'var(--color-ember)', color: '#fff', fontWeight: 800 }}
            >
              {s.n}
            </div>
            <div>
              <h3 className="text-base" style={{ fontWeight: 700 }}>{s.title}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card mt-12 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 800 }}>登録は無料。今なら、王道の座は空いています。</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          あなたの一台が、日本の「美味しい」の基準になる。まずはアカウントを作って、自慢の作り方を1つ登録してみてください。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-ember">無料で創設メンバーになる</Link>
          <Link href="/national" className="btn btn-ghost">王道を見る</Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        ※「創設メンバー」バッジは、初期に参加し実際にレシピを投稿してくださった作り手に運営から付与します。
      </p>
    </div>
  )
}
