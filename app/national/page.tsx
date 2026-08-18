import Link from 'next/link'
import type { Metadata } from 'next'
import { getOrthodoxList, getLikedMixIds } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { MixCard } from '@/components/mix-card'
import { RankingTabs } from '@/components/ranking-tabs'
import { EmptyState } from '@/components/empty-state'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '王道 — 煙道',
  description:
    '実際に吸われ、再現されながら育ってきた「まずこれ」と言える作り方。煙道が確認して認定した王道の一覧です。',
}

/**
 * 王道の一覧。
 * source of truth は combo_orthodoxy（公式認定）のみ。
 * 旧 national_reps（👍・作った・実地評価の自動スコア）は運営内部の候補発見用として温存し、
 * 一般ユーザー向けの王道判定には使わない（2つの王道制度を同時に見せないため）。
 */
export default async function NationalTeamPage() {
  const [list, user] = await Promise.all([getOrthodoxList(), getCurrentUser()])
  const likedIds = user ? await getLikedMixIds() : new Set<string>()

  return (
    <div className="wrap max-w-5xl py-10">
      <RankingTabs current="national" />

      {/* ヒーロー */}
      <div className="text-center">
        <p className="eyebrow">The Royal Road</p>
        <h1 className="mt-2 text-3xl sm:text-4xl" style={{ fontWeight: 800 }}>
          王道シーシャ図鑑
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          実際に吸われ、再現されながら育ってきた、そのフレーバーの
          <b className="bouten">「まずこれ」</b>と言える作り方。
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          作り方の数やいいねだけでは決まりません。実際に吸われた記録や再現実績などを参考に、煙道が確認して認定します。
        </p>
        <div className="smoke-line mx-auto mt-3 w-6" aria-hidden />
      </div>

      {list.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="王"
            title="まだ王道はありません"
            action={<Link href="/" className="btn btn-ember text-sm">今日の一台を探す</Link>}
          >
            作り方が集まり、実際に吸われた記録や再現が積み重なると、煙道が確認して王道を認定します。
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-baseline justify-between gap-2">
            <h2 className="text-sm eyebrow">認定された王道</h2>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              {list.length}件
            </span>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {list.map((entry) => (
              <div key={entry.comboKey} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="seal seal-stamp text-xs">王道</span>
                  {(entry.mix.mix_flavors ?? [])[0]?.flavor_id && (
                    <Link
                      href={`/flavor/${(entry.mix.mix_flavors ?? [])[0]!.flavor_id}`}
                      className="text-xs brush-underline"
                      style={{ color: 'var(--color-ash-dim)' }}
                    >
                      このフレーバーの作り方を見る
                    </Link>
                  )}
                </div>
                <MixCard mix={entry.mix} liked={likedIds.has(entry.mix.id)} isAuthed={!!user} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="btn btn-ghost text-sm">
          フレーバーを見る
        </Link>
      </div>
    </div>
  )
}
