'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'mixhub_onboarded_v1'

/** 初回訪問者向けの軽い案内（localStorage で一度消したら出さない）。 */
export function OnboardingHint({ isAuthed }: { isAuthed: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      // マウント後に localStorage を読んで表示可否を決める（SSRとの不一致を避けるため効果内で実行）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(KEY)) setShow(true)
    } catch {}
  }, [])
  if (!show) return null

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1')
    } catch {}
    setShow(false)
  }

  return (
    <div className="card fade-up mx-auto mb-6 max-w-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm" style={{ fontWeight: 700 }}>👋 はじめての方へ</div>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
            フレーバーを選んで作り方を見る・実際に作って記録する・前の一台と比べる、が主な使い方です。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="#mood" className="chip chip-active">気分で探す</Link>
            <Link href={isAuthed ? '/shelf' : '/signup'} className="chip">🫙 マイフレーバー</Link>
            <Link href="/for-shops" className="chip">🏠 店舗の方へ</Link>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 text-sm" style={{ color: 'var(--color-ash-dim)' }} aria-label="閉じる">
          ✕
        </button>
      </div>
    </div>
  )
}
