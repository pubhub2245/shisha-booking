import Link from 'next/link'
import type { Metadata } from 'next'
import { getNationalTeam, getLikedMixIds, refreshNationalReps } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { ShareBar } from '@/components/share-bar'
import { SITE_URL } from '@/lib/site'
import { flavorLine } from '@/lib/mix'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '日本代表シーシャ図鑑 — MixHub',
  description:
    '日本人が「美味しい」と認めた鉄板ミックスを系統ごとに選出。みんなの👍と「作った！」で選ばれた、日本代表の殿堂です。',
}

// 系統（TYPE_TAGS）ごとの見た目
const CAT_META: Record<string, { icon: string; label: string }> = {
  フルーツ: { icon: '🍎', label: 'フルーツ系' },
  シトラス: { icon: '🍋', label: 'シトラス系' },
  ミント: { icon: '🍃', label: 'ミント系' },
  ベリー: { icon: '🫐', label: 'ベリー系' },
  デザート: { icon: '🍮', label: 'デザート系' },
  トロピカル: { icon: '🌴', label: 'トロピカル系' },
  スパイス: { icon: '🌶️', label: 'スパイス系' },
  ドリンク: { icon: '🥤', label: 'ドリンク系' },
  お茶: { icon: '🍵', label: 'お茶系' },
  和: { icon: '🎐', label: '和' },
}

export default async function NationalTeamPage() {
  // 代表スナップショットを同期（変化があれば新代表の投稿者へ通知）。表示は常に最新計算。
  await refreshNationalReps()
  const [team, user] = await Promise.all([getNationalTeam(), getCurrentUser()])
  const likedIds = user ? await getLikedMixIds() : new Set<string>()

  return (
    <div className="wrap max-w-5xl py-10">
      {/* ヒーロー */}
      <div className="text-center">
        <p className="eyebrow">Japan National Team</p>
        <h1 className="mt-2 text-3xl sm:text-4xl" style={{ fontWeight: 800 }}>
          🇯🇵 日本代表シーシャ図鑑
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          「日本人に美味しい」と言われるシーシャを、みんなで選ぶ。
          <br className="hidden sm:block" />
          系統ごとに、<b>👍いいね</b>と<b>🔥「作った！」</b>で最も支持を集めたミックスが<b>日本代表</b>に選出されます。
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 選出基準：支持スコア（👍＋🔥作った×2）が1以上・本物のレシピを優先。あなたの👍と「作った！」が代表の顔ぶれを変えます。
          <br />本物のレシピが未選出の系統は「暫定代表」と表示され、投稿が集まり次第 差し替わります。
        </p>
      </div>

      {team.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="text-base" style={{ fontWeight: 700 }}>まだ代表が決まっていません</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
            ミックスに👍や「作った！」が集まると、系統ごとの日本代表が選出されます。
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/" className="btn btn-ghost">図鑑を見る</Link>
            <Link href="/post" className="btn btn-ember">＋ ミックスを投稿</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            <span className="rounded-full px-3 py-1" style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
              現在の代表 {team.length} 系統
            </span>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((rep) => {
              const meta = CAT_META[rep.category] ?? { icon: '⭐', label: rep.category }
              return (
                <div key={rep.category} className="flex flex-col gap-2">
                  {/* ポジション見出し（系統） */}
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5 text-sm" style={{ fontWeight: 800 }}>
                      <span aria-hidden>{meta.icon}</span>
                      {meta.label} 代表
                    </span>
                    {rep.sample ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.6rem]"
                        style={{ background: 'var(--line)', color: 'var(--color-ash-dim)', fontWeight: 800, letterSpacing: '0.05em' }}
                        title="本物のレシピが集まるまでの暫定枠です"
                      >
                        暫定代表
                      </span>
                    ) : (
                      <span
                        className="rounded-full px-2 py-0.5 text-[0.6rem]"
                        style={{ background: 'linear-gradient(90deg, #bc002d, #e60033)', color: '#fff', fontWeight: 800, letterSpacing: '0.05em' }}
                      >
                        日本代表
                      </span>
                    )}
                  </div>
                  {/* 代表ミックス */}
                  <MixCard mix={rep.mix} liked={likedIds.has(rep.mix.id)} isAuthed={!!user} />
                  {/* 支持スタッツ */}
                  <div className="flex items-center gap-3 px-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    <span>👍 {rep.likes}</span>
                    <span>🔥 作った {rep.makes}</span>
                    {rep.onsite > 0 && (
                      <span title="現地で実物を吸って評価" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                        📍 実地 {rep.onsite}
                      </span>
                    )}
                    <span className="ml-auto" style={{ fontWeight: 700, color: 'var(--color-ash)' }}>
                      支持スコア {rep.score}
                    </span>
                  </div>
                  {!rep.sample && (
                    <div className="px-1">
                      <ShareBar
                        url={`${SITE_URL}/mix/${rep.mix.id}`}
                        text={`🇯🇵 ${meta.label}の日本代表はこれ！\n${flavorLine(rep.mix.mix_flavors)}${rep.mix.title ? `（${rep.mix.title}）` : ''}\n#シーシャ #MixHub #日本代表シーシャ図鑑`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-10 text-center text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            納得いかない？ もっと美味しいミックスを{' '}
            <Link href="/post" className="hover:underline" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
              投稿して代表の座を奪いましょう
            </Link>
            。
          </p>
        </>
      )}
    </div>
  )
}
