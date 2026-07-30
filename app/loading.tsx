export default function Loading() {
  return (
    <div className="wrap py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 h-8 w-2/3 animate-pulse rounded-lg" style={{ background: 'var(--color-smoke-800)' }} />
        <div className="mb-8 h-4 w-1/2 animate-pulse rounded-lg" style={{ background: 'var(--color-smoke-800)' }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="mb-3 h-4 w-1/2 animate-pulse rounded" style={{ background: 'var(--color-smoke-800)' }} />
              <div className="mb-2 h-5 w-4/5 animate-pulse rounded" style={{ background: 'var(--color-smoke-800)' }} />
              <div className="h-4 w-full animate-pulse rounded" style={{ background: 'var(--color-smoke-800)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
