'use client'

import { useState } from 'react'

const ITEMS: { q: string; a: string }[] = [
  {
    q: 'シーシャとは？',
    a: '水タバコとも呼ばれ、フレーバー付きの煙を水を通して楽しむ嗜好品です。当店ではノンニコチンフレーバーのみを使用しておりますので、タバコを吸わない方でもお気軽にお楽しみいただけます。フルーツやスイーツなど豊富な香りをご用意しております。',
  },
  {
    q: 'ニコチンは入っていますか？',
    a: '当店はノンニコチンフレーバーのみを使用しております。ニコチン・タールは一切含まれておりませんので、安心してお楽しみいただけます。',
  },
  {
    q: '何人から利用できますか？',
    a: 'お一人様からご利用いただけます。人数や台数に応じてご用意いたします。',
  },
  {
    q: '予約のキャンセルはできますか？',
    a: '申し訳ございませんが、ご予約後のキャンセルはお受けしておりません。日程の変更をご希望の場合は、Instagram DMにてお早めにご相談ください。',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="space-y-3">
      {ITEMS.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex justify-between items-center px-5 py-4 text-left font-medium hover:bg-white/5 transition-colors"
            >
              <span>{item.q}</span>
              <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-gray-300 text-sm leading-relaxed">
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
