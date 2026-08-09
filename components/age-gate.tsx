'use client'

import { useState } from 'react'

/**
 * 年齢確認ゲート。生年月を入力させ、20歳以上のときだけ通過できる。
 * （単なる「はい」ボタンより実効性を高めたソフトゲート。確認後は1年間クッキー保存）
 */
export function AgeGate() {
  const [gone, setGone] = useState(false)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)

  if (gone) return null

  const thisYear = 2026 // 表示レンジの基準（送信時は入力値で判定）
  const years: number[] = []
  for (let y = thisYear - 5; y >= thisYear - 100; y--) years.push(y)

  function verify() {
    const y = Number(year)
    const m = Number(month)
    if (!y || !m) {
      setError('生年月を選択してください。')
      return
    }
    // 満年齢を概算（今日 2026-08-09 基準）。誕生日未到来なら1引く。
    const now = { y: 2026, m: 8, d: 9 }
    let age = now.y - y
    if (m > now.m) age -= 1
    if (age >= 20) {
      document.cookie = `age_ok=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      setGone(true)
    } else {
      setBlocked(true)
    }
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
              当サービスはシーシャ（喫煙関連）の情報を扱います。<br />生年月をご入力ください。
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value)
                  if (error) setError('')
                }}
                aria-label="生まれた年"
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
              >
                <option value="">生年</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value)
                  if (error) setError('')
                }}
                aria-label="生まれた月"
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
            {error && <p className="mt-2 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{error}</p>}
            <div className="mt-5">
              <button type="button" onClick={verify} className="btn btn-ember w-full">確認して進む</button>
            </div>
            <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              20歳未満の方はご利用いただけません。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
