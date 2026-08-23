'use client'

import Link from 'next/link'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap flex max-w-md flex-col items-center py-28 text-center">
      <h1 className="mt-4 text-2xl" style={{ fontWeight: 800 }}>
        うまく表示できませんでした
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        一時的な問題が発生した可能性があります。もう一度お試しください。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-ember">
          再読み込み
        </button>
        <Link href="/" className="btn btn-ghost">図鑑にもどる</Link>
      </div>
    </div>
  )
}
