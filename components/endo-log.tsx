'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteExperience } from '@/actions/social'
import { deleteTasteEvaluation } from '@/actions/taste'
import { TasteInput } from '@/components/taste-input'
import { TASTE_AXES } from '@/lib/taste'
import { flavorLine } from '@/lib/mix'
import { formatJaDate } from '@/lib/time'
import type { SmokeLogEntry } from '@/lib/queries'

/** 内部値 → 一般UIの表現。嗜好品なので強い否定表現にしない。 */
const VERDICT_LABEL: Record<'again' | 'good' | 'ok' | 'not_for_me', string> = {
  again: 'また吸いたい',
  good: 'おいしかった',
  ok: 'ふつう',
  not_for_me: '好みではなかった',
}

type Filter = 'all' | 'smoked' | 'made'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'smoked', label: '吸った' },
  { key: 'made', label: '作った' },
]

function KindLabel({ entry }: { entry: SmokeLogEntry }) {
  if (entry.kind === 'rated') {
    return (
      <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
        ★{entry.score}
        {entry.shopName ? ` ・ ${entry.shopName}` : ''}
      </span>
    )
  }
  return (
    <span className="text-xs" style={{ color: 'var(--color-ash)' }}>
      {entry.kind === 'made' ? '作った' : '吸った'}
    </span>
  )
}

export function EndoLog({ entries }: { entries: SmokeLogEntry[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editTasteId, setEditTasteId] = useState<string | null>(null)

  const shown = entries.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'made') return e.kind === 'made'
    // 「吸った」フィルタは自己申告の smoked のみ（作ったは別タブで見る）
    return e.kind === 'smoked'
  })

  return (
    <div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className="rounded-full border px-2.5 py-1 text-xs transition-colors"
              style={{
                borderColor: active ? 'var(--color-ember)' : 'var(--line)',
                color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)',
                background: active ? 'var(--accent-tint)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-ash)' }}>
          この条件の記録はまだありません。
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
          {shown.map((e, i) => (
            <li key={e.id ?? `${e.kind}-${e.mix.id}-${i}`} className="flex flex-col gap-1.5 py-3">
              <div className="flex items-start gap-3">
                <span className="w-16 shrink-0 pt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                  {formatJaDate(e.at)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/mix/${e.mix.id}`}
                    className="block truncate text-sm brush-underline"
                    style={{ fontWeight: 600 }}
                  >
                    {flavorLine(e.mix.mix_flavors) || e.mix.title || 'ミックス'}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <KindLabel entry={e} />
                    {e.verdict && (
                      <span className="text-xs" style={{ color: 'var(--color-seal)', fontWeight: 600 }}>
                        {VERDICT_LABEL[e.verdict]}
                      </span>
                    )}
                    {/*
                      同じ一台を繰り返すのは「重複」ではなく好み・習慣として見せる。
                      通算は種別ごと（吸った＝smokedのみ／作った＝madeのみ）。
                      例）吸った2回・作った1回 → 2回目の吸ったは「吸った 2回目」、作ったは「作った 1回目」
                    */}
                    {e.kind !== 'rated' && e.nth >= 1 && (
                      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        {e.nth}回目
                      </span>
                    )}
                  </div>

                  {/* 自分が付けた味覚評価（本人のみ表示） */}
                  {e.id && e.taste && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        {TASTE_AXES.filter((a) => e.taste?.[a.key] != null)
                          .map((a) => `${a.label} ${e.taste?.[a.key]}`)
                          .join(' / ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditTasteId(editTasteId === e.id ? null : e.id)}
                        className="text-xs underline underline-offset-2"
                        style={{ color: 'var(--color-ash-dim)' }}
                      >
                        編集
                      </button>
                      <form action={deleteTasteEvaluation}>
                        <input type="hidden" name="experience_id" value={e.id} />
                        <button type="submit" className="text-xs underline underline-offset-2" style={{ color: 'var(--color-ash-dim)' }}>
                          味覚を削除
                        </button>
                      </form>
                    </div>
                  )}
                  {e.id && !e.taste && e.kind !== 'rated' && (
                    <button
                      type="button"
                      onClick={() => setEditTasteId(editTasteId === e.id ? null : e.id)}
                      className="mt-1 text-xs underline underline-offset-2"
                      style={{ color: 'var(--color-ash-dim)' }}
                    >
                      味の印象を残す
                    </button>
                  )}
                </div>
                {e.id && (
                  <button
                    type="button"
                    onClick={() => setConfirmId(confirmId === e.id ? null : e.id)}
                    aria-label="この記録を削除"
                    className="shrink-0 rounded px-1.5 text-xs"
                    style={{ color: 'var(--color-ash-dim)' }}
                  >
                    ⋯
                  </button>
                )}
              </div>

              {e.id && editTasteId === e.id && (
                <div className="ml-16">
                  <TasteInput
                    experienceId={e.id}
                    mixId={e.mix.id}
                    initial={Object.fromEntries(
                      TASTE_AXES.filter((a) => e.taste?.[a.key] != null).map((a) => [a.key, e.taste![a.key]!])
                    )}
                  />
                </div>
              )}

              {/* 誤タップで消えないよう、確認を挟んでから削除する */}
              {e.id && confirmId === e.id && (
                <div
                  className="ml-16 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: 'var(--accent-tint)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--color-ash)' }}>
                    この記録を削除しますか？（他の記録は残ります）
                  </span>
                  <form action={deleteExperience}>
                    <input type="hidden" name="experience_id" value={e.id} />
                    <button type="submit" className="text-xs" style={{ color: 'var(--color-seal)', fontWeight: 700 }}>
                      削除する
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="text-xs"
                    style={{ color: 'var(--color-ash-dim)' }}
                  >
                    やめる
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
