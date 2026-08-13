'use client'

import { useState } from 'react'

const COLORS = ['#1f8a76', '#e0552a', '#4a86e8', '#a479e2', '#d5992b', '#c0407a', '#2ba088']

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** アバター。画像(src)があれば写真、無ければイニシャル表示（決定的な色）。 */
export function Avatar({
  name,
  seed,
  size = 32,
  src,
}: {
  name?: string | null
  seed?: string | null
  size?: number
  src?: string | null
}) {
  const [imgError, setImgError] = useState(false)
  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={(name ?? '').trim() || 'プロフィール画像'}
        className="inline-block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    )
  }
  const label = (name ?? '').trim()
  const initial = label ? [...label][0]!.toUpperCase() : '?'
  const color = COLORS[hashStr(seed || label || '?') % COLORS.length]
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42, fontWeight: 700 }}
    >
      {initial}
    </span>
  )
}
