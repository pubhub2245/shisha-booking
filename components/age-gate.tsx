'use client'

import { useState } from 'react'

/**
 * 年齢確認ゲート（ソフトゲート）。20歳以上の確認が取れるまで全画面で覆う。
 * 確認後は1年間クッキーに保存し、サーバー側でこのゲート自体を出さなくする。
 */
export function AgeGate() {
  const [blocked, setBlocked] = useState(false)
  const [gone, setGone] = useState(false)

  if (gone) return null

  function accept() {
    document.cookie = `age_ok=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setGone(true)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgb(10 9 7 / 0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="年齢確認"
    >
      <div className="card w-full max-w-sm p-7 text-center">
        <div className="brand-mark text-2xl">
          Mix<span className="ember-text">Hub</span>
        </div>
        {blocked ? (
          <>
            <p className="mt-4 text-base" style={{ fontWeight: 700 }}>ご利用いただけません</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              当サービスはシーシャ（喫煙関連）に関する情報を扱うため、20歳以上の方のみご利用いただけます。
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-base" style={{ fontWeight: 700 }}>年齢確認</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              当サービスはシーシャ（喫煙関連）に関する情報を扱います。<br />あなたは20歳以上ですか？
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={accept} className="btn btn-ember">はい（20歳以上）</button>
              <button
                type="button"
                onClick={() => setBlocked(true)}
                className="btn btn-ghost"
              >
                いいえ
              </button>
            </div>
            <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              「はい」を選ぶと年齢確認に同意したものとみなします。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
