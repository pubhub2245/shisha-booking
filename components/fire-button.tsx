'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 「火を入れる」。長押しで炭が熾る、サイト全体でただ1つの「設計されたインタラクション」。
 *
 * 例外でいられる条件（CLAUDE.md 2026-08-19 の判断）を全部満たす：
 *   ・点・バッジ・順位・連続記録を与えない
 *   ・状態を保存しない（DB にも localStorage にも書かない）
 *   ・次の行動を要求しない（押した先に何も起きない）
 *   ・サイト全体でこれ1つだけ
 *
 * 見せるために JS を必要としない。JS が動かない環境でもボタンはそのまま描かれ、
 * 押しても何も起きないだけ（2026-08-20 の「本文が丸ごと消える」事故の再発防止）。
 */

/** 溜まりきるまでの長さ。押し間違いにはならず、待たされたとも感じない所 */
const FILL_MS = 1200
/** 離したときに戻る長さ。急に0にしない */
const DECAY_MS = 320

/** 動きが苦手な設定・寝かせたスマホ。components/scrub-hero.tsx の GATES と字句まで一致させる */
const GATES = [
  '(prefers-reduced-motion: reduce)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
]

export function FireButton() {
  const rootRef = useRef<HTMLDivElement>(null)
  const raf = useRef<number | null>(null)
  /** いま画面に書いてある値。変わったときだけ書くために持つ */
  const shown = useRef(0)
  const held = useRef(false)
  const lit = useRef(false)
  const [status, setStatus] = useState('')

  const write = useCallback((v: number) => {
    const el = rootRef.current
    if (!el) return
    if (Math.abs(v - shown.current) < 0.005 && v !== 0 && v !== 1) return
    shown.current = v
    el.style.setProperty('--fire', String(v))
  }, [])

  const light = useCallback(() => {
    if (lit.current) return
    lit.current = true
    write(1)
    const el = rootRef.current
    if (el) {
      el.classList.add('is-lit')
      el.closest('.smoke-stage')?.classList.add('is-lit')
    }
    setStatus('火が入った')
  }, [write])

  const stopRaf = useCallback(() => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [])

  const run = useCallback(
    (from: number, to: number, ms: number, done?: () => void) => {
      stopRaf()
      const t0 = performance.now()
      const step = (now: number) => {
        const k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms)
        write(from + (to - from) * k)
        if (k < 1) {
          raf.current = requestAnimationFrame(step)
        } else {
          raf.current = null
          done?.()
        }
      }
      raf.current = requestAnimationFrame(step)
    },
    [stopRaf, write],
  )

  const press = useCallback(() => {
    if (lit.current || held.current) return
    held.current = true
    // 動きが苦手な人・寝かせたスマホには溜めを見せない。押した瞬間に火を入れる
    if (typeof window !== 'undefined' && GATES.some((q) => window.matchMedia(q).matches)) {
      light()
      return
    }
    run(shown.current, 1, FILL_MS * (1 - shown.current), light)
  }, [light, run])

  const release = useCallback(() => {
    if (!held.current) return
    held.current = false
    if (lit.current) return
    run(shown.current, 0, DECAY_MS * shown.current)
  }, [run])

  useEffect(() => stopRaf, [stopRaf])

  return (
    <div className="fire" ref={rootRef} style={{ ['--fire' as string]: 0 }}>
      <button
        type="button"
        className="fire-btn"
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onBlur={release}
        onKeyDown={(e) => {
          if (e.repeat) return
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            press()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') release()
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="fire-coal" aria-hidden>
          <span className="fire-glow" />
        </span>
        長押しで火を入れる
      </button>
      <p className="fire-status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
