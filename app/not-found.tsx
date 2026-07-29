import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap flex max-w-md flex-col items-center py-28 text-center">
      <div className="text-5xl">💨</div>
      <h1 className="mt-4 text-2xl" style={{ fontWeight: 800 }}>
        煙のように消えました
      </h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
        お探しのページは見つかりませんでした。
      </p>
      <Link href="/" className="btn btn-ember mt-6">図鑑にもどる</Link>
    </div>
  )
}
