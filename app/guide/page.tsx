import Link from 'next/link'
import { IconOrb, type OrbPreset } from '@/components/icon-orb'
import { HMS_OPTIONS, hmsBowls } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'
import { BowlIcon } from '@/components/bowl-icon'
import { SourceLine } from '@/components/source-line'
import { HMS_BOWL_SOURCES, GUIDE_SOURCES } from '@/lib/sources'

export const metadata = {
  title: '美味しいシーシャの作り方ガイド',
  description:
    '下準備・盛り方・熱管理・むらし・提供のタイミングまで。現場で受け継がれてきた「美味しいシーシャの作り方」を体系的にまとめた実践ガイド。',
}

/** 目指すところ（4本柱） */
const goals: { icon: string; preset: OrbPreset; title: string; body: string }[] = [
  { icon: '💨', preset: 'green', title: '吸いやすい', body: '軽く吸える。詰まらず、抵抗が少ない。' },
  { icon: '✅', preset: 'amber', title: '焦げていない', body: 'イガらっぽさ・雑味がない。' },
  { icon: '🍬', preset: 'violet', title: '味がある', body: 'フレーバー本来の甘さ・香りが立つ。' },
  { icon: '☁️', preset: 'blue', title: '煙が出る', body: 'もくもくと満足感のある煙量。' },
]

type Section = {
  id: string
  icon: string
  title: string
  lead?: string
  points: { h: string; body: string }[]
}

const sections: Section[] = [
  {
    id: 'prep',
    icon: '🍃',
    title: 'フレーバーの下準備',
    lead: '味と燃え方は、盛る前の一手間で大きく変わる。',
    points: [
      { h: '茎（軸）は捨てる', body: '茎の部分は焦げたときに変な味が出やすい。取り除いておくと雑味が減る。' },
      { h: '葉の大きさを均等にする', body: '大きさがバラバラだと燃焼度に差が出て、味の出方にムラができる。ちぎってサイズを揃える。' },
      { h: 'くっついた葉ははがす', body: '葉同士が固まっていると熱が均一に入らない。1枚ずつほぐしてから盛る。' },
    ],
  },
  {
    id: 'pack',
    icon: '🥣',
    title: '盛り方',
    lead: '「かまぼこ」を一周させるイメージ。',
    points: [
      { h: 'かまぼこ型で一周', body: 'ボウルのふちに沿って、かまぼこ（半円）を一周ぐるりと描くように盛る。中央は空気が抜ける道を残す。' },
      { h: 'はみ出しを作らない', body: 'かまぼこからはみ出したフレーバーは、アルミやHMSに直接触れて焦げやすい。はみ出しは無くす。' },
    ],
  },
  {
    id: 'management',
    icon: '🌡️',
    title: '熱管理の考え方',
    lead: '「熱風がどこから入ってくるか」を常に意識する。',
    points: [
      { h: '空気の通り道を読む', body: '炭の熱がどこからボウルへ入り、どこへ抜けるか。この流れをイメージできると、火力の当て方をコントロールできる。' },
      { h: 'ターキッシュリッドの特性', body: '隅（ふちのすぐ下）に空気の層があるため、温度がじわじわと上がっていく。急がず、立ち上がりを待つ管理が向く。' },
    ],
  },
  {
    id: 'foil',
    icon: '🪙',
    title: 'アルミホイル',
    lead: '保温性とエアフローはトレードオフ。',
    points: [
      { h: '三つ折り＝保温性UP', body: 'アルミを三つ折りにすると熱がこもり保温性は上がる。ただし空気の層（エアフロー）ができる。' },
      { h: 'エアフローは基本おすすめしない', body: '空気の層ができると熱管理が難しくなる。安定させたいなら、エアフローを作らない張り方を基本にする。' },
    ],
  },
  {
    id: 'heat',
    icon: '🔥',
    title: '熱入れ・むらし',
    lead: 'ここで味の8割が決まる。',
    points: [
      { h: 'むらしは7分が目安', body: '炭を乗せてからのむらしは7分程度。忙しいときは「トップ（アルミ／HMSの表面）を2〜3秒触れなくなるくらい」を目安にすると速い。' },
      { h: '吸い方は「細く長く」', body: '最初は細く長く吸って、下までしっかり熱を通す。細く“短く”はNG。一定の強さで吸い、強弱をつけない（＝一般的なお客さんの吸い方を再現する）。' },
    ],
  },
  {
    id: 'serve',
    icon: '⏱️',
    title: '提供のタイミング',
    points: [
      { h: '3口ルール', body: '普通の吸い方で3回吸って、味に変化がなくなったら（＝安定したら）提供のサイン。' },
    ],
  },
  {
    id: 'mix',
    icon: '🧩',
    title: 'ミックスの基本',
    lead: 'メインの味を「補完」するイメージで組む。',
    points: [
      { h: 'メイン＋補助で考える', body: '主役のフレーバーを決め、それを引き立てる補助を足す。足し算で埋もれさせず、メインの輪郭を強くする。' },
      { h: '例：メイン＝ライチ', body: '補助にゴールデンデリシャスアップルやチェリーを合わせる。甘さと香りに奥行きが出る。' },
    ],
  },
]

/** フレーバーの味の出方（温度帯で変化する） */
const flavorProfiles: { name: string; low: string; high: string; note?: string }[] = [
  {
    name: 'ダブルアップル',
    low: '青りんご',
    high: 'アニス〜リコリス',
    note: '温度が上がるにつれ 青りんご → 赤りんご → アニス → リコリス と表情が変わる。',
  },
  { name: 'ベリー系', low: '酸味が立つ', high: '甘み＋爽快感' },
  { name: 'ミント系', low: 'ガム／キシリトール感', high: '甘みのあるスペアミント' },
]

export default function GuidePage() {
  return (
    <div className="wrap max-w-2xl py-12">
      <p className="eyebrow">作り方ガイド</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
        美味しいシーシャの、<br />作り方ガイド。
      </h1>
      <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        現場で受け継がれてきた「美味しいシーシャの作り方」を、下準備から提供まで順番にまとめました。
        投稿する熱管理カーブと合わせて読むと、一気に再現度が上がります。
      </p>

      {/* 目指すところ */}
      <section className="mt-10">
        <h2 className="text-lg" style={{ fontWeight: 700 }}>まず、目指すところ</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          この4つが揃っていれば「美味しい1台」。すべての工程はここに向かっている。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {goals.map((g) => (
            <div key={g.title} className="card flex items-center gap-3 p-4">
              <IconOrb preset={g.preset} size={42}>{g.icon}</IconOrb>
              <div className="min-w-0">
                <h3 className="text-sm" style={{ fontWeight: 700 }}>{g.title}</h3>
                <p className="mt-0.5 text-xs leading-snug" style={{ color: 'var(--color-ash)' }}>{g.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 目次 */}
      <nav className="card mt-8 p-5">
        <p className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 700 }}>目次</p>
        <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm" style={{ color: 'var(--color-ember-hot)' }}>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:underline">
                {i + 1}. {s.icon} {s.title}
              </a>
            </li>
          ))}
          <li>
            <a href="#profiles" className="hover:underline">{sections.length + 1}. 🌡️ 温度で変わる味</a>
          </li>
          <li>
            <a href="#hms-bowl" className="hover:underline">{sections.length + 2}. 🪨 HMD × ボウルの相性</a>
          </li>
        </ol>
      </nav>

      {/* 各セクション */}
      <div className="mt-8 flex flex-col gap-6">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="card p-6" style={{ scrollMarginTop: 80 }}>
            <div className="flex items-baseline gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}
              >
                {i + 1}
              </span>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                <span aria-hidden className="mr-1.5">{s.icon}</span>{s.title}
              </h2>
            </div>
            {s.lead && (
              <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>{s.lead}</p>
            )}
            <ul className="mt-4 flex flex-col gap-3">
              {s.points.map((p) => (
                <li key={p.h} className="border-l-2 pl-3" style={{ borderColor: 'var(--color-ember)' }}>
                  <p className="text-sm" style={{ fontWeight: 700 }}>{p.h}</p>
                  <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{p.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* 温度で変わる味 */}
        <section id="profiles" className="card p-6" style={{ scrollMarginTop: 80 }}>
          <div className="flex items-baseline gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
              style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}
            >
              {sections.length + 1}
            </span>
            <h2 className="text-lg" style={{ fontWeight: 700 }}>
              <span aria-hidden className="mr-1.5">🌡️</span>フレーバーの味の出方（温度で変わる）
            </h2>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            同じフレーバーでも、低温と高温で出てくる味が変わる。熱管理はこの変化を狙って行う。
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {flavorProfiles.map((f) => (
              <div key={f.name} className="rounded-lg border p-4" style={{ borderColor: 'var(--line)' }}>
                <p className="text-sm" style={{ fontWeight: 700 }}>{f.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{ background: 'rgb(31 138 118 / 0.1)', color: 'var(--color-coal)', fontWeight: 600 }}
                  >
                    低温 → {f.low}
                  </span>
                  <span aria-hidden style={{ color: 'var(--color-ash-dim)' }}>→</span>
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 600 }}
                  >
                    高温 → {f.high}
                  </span>
                </div>
                {f.note && (
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>{f.note}</p>
                )}
              </div>
            ))}
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
              補足：ペアチル系は、ゴールデンデリシャスアップルに“別会社のラフランス”を合わせるなど、
              銘柄を掛け合わせて狙いの香りを作る手法もある。
            </p>
          </div>
        </section>

        {/* HMD × ボウルの相性 */}
        <section id="hms-bowl" className="card p-6" style={{ scrollMarginTop: 80 }}>
          <div className="flex items-baseline gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
              style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}
            >
              {sections.length + 2}
            </span>
            <h2 className="text-lg" style={{ fontWeight: 700 }}>
              <span aria-hidden className="mr-1.5">🪨</span>HMD × ボウルの相性
            </h2>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash-dim)' }}>
            熱源（HMD）とボウルには相性がある。ファンネル系は中央の穴が詰まりにくくエアフローが安定し、味変化がゆるやかで少量でも煙が出やすい。以下は選ぶときの目安。
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {HMS_OPTIONS.filter((o) => o.v !== 'other' && (hmsBowls(o.v).length > 0 || o.bowlNote)).map((o) => (
              <div key={o.v} className="rounded-lg border p-4" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2.5">
                  <span style={{ color: 'var(--color-ember-hot)' }}><HmsIcon type={o.icon} size={30} /></span>
                  <span className="text-sm" style={{ fontWeight: 700 }}>{o.l}</span>
                  {o.en && <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{o.en}</span>}
                </div>
                {hmsBowls(o.v).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hmsBowls(o.v).map((b) => (
                      <span
                        key={b.v}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                        style={{ borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
                      >
                        <span style={{ color: 'var(--color-ember-hot)' }}><BowlIcon type={b.icon} size={16} /></span>
                        {b.l}
                      </span>
                    ))}
                  </div>
                )}
                {o.bowlNote && (
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>{o.bowlNote}</p>
                )}
              </div>
            ))}
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
              ※ 相性はあくまで目安。ボウルの穴の形状（1穴／多穴）やフレーバーの水分量でも最適解は変わる。
            </p>
            <SourceLine sources={HMS_BOWL_SOURCES} className="mt-1" />
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="text-xl" style={{ fontWeight: 700 }}>読んだら、作り方を記録しよう。</h2>
        <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
          熱管理カーブには、各時点のキューブ炭の個数まで残せます。あなたのノウハウを図鑑に。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/post" className="btn btn-ember">ミックスを投稿</Link>
          <Link href="/" className="btn btn-ghost">図鑑を見る</Link>
        </div>
      </div>

      {/* 参考リンク */}
      <div className="mt-8 rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <p className="text-xs" style={{ color: 'var(--color-ash)', fontWeight: 700 }}>参考にした情報源</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          道具・相性の解説は下記の一般的なシーシャ情報サイトに沿って記載しています。作り方の要点は現場のノウハウも参考にしています。
        </p>
        <SourceLine sources={GUIDE_SOURCES} prefix="参考" className="mt-2" />
      </div>
    </div>
  )
}
