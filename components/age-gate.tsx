'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { BRAND } from '@/lib/site'
import { AGE_OK_COOKIE, AGE_OK_MAX_AGE, isOldEnough } from '@/lib/age'

/**
 * 年齢確認ゲート。生年月を入力させ、20歳以上のときだけ通過できる。
 * （単なる「はい」ボタンより実効性を高めたソフトゲート。確認後は1年間クッキー保存）
 *
 * JS が動かない環境でも通れるように、本体は普通のフォーム（POST /age）。
 * JS が動くときは送信を横取りして、その場で判定してクッキーを書く。
 * 判定の計算は lib/age.ts に1つだけ置き、受け口（app/age/route.ts）と同じものを使う。
 */
export function AgeGate({ initialBlocked = false }: { initialBlocked?: boolean }) {
  const pathname = usePathname()
  const [gone, setGone] = useState(false)
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(initialBlocked)
  // 表示レンジの基準（実時刻から算出。lazy init で毎レンダーの再計算を避ける）
  const [thisYear] = useState(() => new Date().getFullYear())

  if (gone) return null

  const years: number[] = []
  for (let y = thisYear - 5; y >= thisYear - 100; y--) years.push(y)

  function verify(e: React.FormEvent<HTMLFormElement>) {
    // JS が動いているときはここで判定して終わる。動かないときはフォームが /age へ送られる
    e.preventDefault()
    if (!year || !month) {
      setError('生年月を選択してください。')
      return
    }
    if (isOldEnough(year, month)) {
      document.cookie = `${AGE_OK_COOKIE}=1; path=/; max-age=${AGE_OK_MAX_AGE}; samesite=lax`
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
          {BRAND.name}
          <span
            className="ember-text"
            style={{ fontSize: '0.55em', letterSpacing: '0.2em', marginLeft: '0.45em' }}
          >
            {BRAND.nameEn}
          </span>
        </div>
        {blocked ? (
          <>
            <p className="mt-4 text-base" style={{ fontWeight: 700 }}>ご利用いただけません</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              当サービスはシーシャ（喫煙関連）に関する情報を扱うため、20歳以上の方のみご利用いただけます。
            </p>
          </>
        ) : (
          <form method="post" action="/age" onSubmit={verify}>
            <input type="hidden" name="next" value={pathname || '/'} />
            <p className="mt-4 text-base" style={{ fontWeight: 700 }}>年齢確認</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
              当サービスはシーシャ（喫煙関連）の情報を扱います。<br />生年月をご入力ください。
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <select
                name="year"
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
                name="month"
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
              <button type="submit" className="btn btn-ember w-full">確認して進む</button>
            </div>
            <p className="mt-4 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              20歳未満の方はご利用いただけません。
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
