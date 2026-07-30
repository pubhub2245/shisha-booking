/** シーシャ店スタッフの認証マーク（運営が付与） */
export function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="認証済み（シーシャ店スタッフ）"
      className="inline-block shrink-0 align-[-2px]"
    >
      <title>認証済み（シーシャ店スタッフ）</title>
      <path
        fill="var(--color-ember)"
        d="M12 1.5l2.36 1.7 2.9-.2 1 2.73 2.53 1.42-.83 2.79.83 2.79-2.53 1.42-1 2.73-2.9-.2L12 22.5l-2.36-1.7-2.9.2-1-2.73-2.53-1.42.83-2.79-.83-2.79 2.53-1.42 1-2.73 2.9.2z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.2 12.2l2.5 2.5 5-5.4"
      />
    </svg>
  )
}
