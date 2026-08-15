'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Step = { key: string; label: string; href: string; done: boolean }

/**
 * 初回ユーザー向けのオンボーディング チェックリスト。
 * すべて完了、または一度閉じた場合は表示しない（localStorage に記録）。
 */
export function OnboardingCard({
  hasProfile,
  hasShelf,
  hasPosted,
}: {
  hasProfile: boolean
  hasShelf: boolean
  hasPosted: boolean
}) {
  const [dismissed, setDismissed] = useState(true) // 初期は隠す（ハイドレーション後に判定）

  useEffect(() => {
    // クライアントでのみ localStorage を参照して表示可否を確定する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem('mixhub-onboarding-dismissed') === '1')
  }, [])

  const steps: Step[] = [
    { key: 'profile', label: 'プロフィールを設定', href: '/mypage', done: hasProfile },
    { key: 'shelf', label: 'マイフレーバーを登録', href: '/shelf', done: hasShelf },
    { key: 'post', label: '最初の作り方を投稿', href: '/post', done: hasPosted },
  ]
  const doneCount = steps.filter((s) => s.done).length

  if (dismissed || doneCount === steps.length) return null

  return (
    <section className="card mx-auto mt-6 max-w-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm" style={{ fontWeight: 700 }}>
          はじめてガイド <span style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>（{doneCount}/{steps.length}）</span>
        </h2>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('mixhub-onboarding-dismissed', '1')
            setDismissed(true)
          }}
          className="text-xs"
          style={{ color: 'var(--color-ash-dim)' }}
        >
          閉じる
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-[var(--accent-tint)]"
            style={{ borderColor: 'var(--line)' }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
              style={
                s.done
                  ? { background: 'var(--color-ember)', color: '#fff' }
                  : { border: '2px solid var(--line-strong)', color: 'var(--color-ash-dim)' }
              }
            >
              {s.done ? '✓' : ''}
            </span>
            <span
              className="flex-1 text-sm"
              style={{ color: s.done ? 'var(--color-ash-dim)' : 'var(--color-cream)', textDecoration: s.done ? 'line-through' : 'none', fontWeight: 600 }}
            >
              {s.label}
            </span>
            {!s.done && <span style={{ color: 'var(--color-ember-hot)' }}>→</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}
