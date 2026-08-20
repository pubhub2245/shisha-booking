'use client'

import { useEffect } from 'react'

/**
 * 動きを止める2系統の見張り役。何も描画しない。
 *
 * (a) タブが裏に回ったら止める
 *     body に .paused を付け、CSS 側の
 *     `body.paused *, *::before, *::after { animation-play-state: paused }` で止める。
 *     animation-play-state は継承しないので、親に付けても子や擬似要素には届かない。
 *     だから全称セレクタで指定してあり、ここではクラスを付け外しするだけにしている。
 *
 * (b) 画面の外にあるものは動かさない
 *     .loop-anim を持つ要素を観測し、見えている間だけ data-inview を付ける。
 *     CSS 側でループアニメは「data-inview が付いているときだけ」定義されているので、
 *     一時停止ではなく規則そのものが出入りする。
 *     class ではなく属性なのは、React が className を管理していて、
 *     ここで触ると hydration の不一致になるため（実際に警告が出た）。
 *
 * next/link でページを移っても監視が二重にならないよう、後片付けで
 * リスナも observer も外し、body のクラスも消す。
 */
export function MotionGuards() {
  useEffect(() => {
    const body = document.body
    // 画面外で止めたいループアニメ
    const LOOPING = '.float, .text-grad-anim, .loop-anim, .smoke-field, .axes'

    // (a) 裏タブ
    const onVisibility = () => {
      body.classList.toggle('paused', document.visibilityState === 'hidden')
    }
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()

    // (c) 入場の振り付け。[data-rise] が画面に入ったら一度だけ .in を付ける。
    //     付けっぱなしにするのは、戻ってきたときに消えないようにするため。
    //     入場が終わったら .done を足して段差の遅延を外す（外さないと以後の
    //     ホバーが延々とずれる）。
    let rise: IntersectionObserver | null = null
    const timers: number[] = []
    if ('IntersectionObserver' in window) {
      rise = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            const el = e.target as HTMLElement
            el.classList.add('in')
            timers.push(window.setTimeout(() => el.classList.add('done'), 1200))
            rise!.unobserve(el)
          }
        },
        { rootMargin: '0px 0px -12% 0px' },
      )
      document.querySelectorAll('[data-rise]').forEach((el) => rise!.observe(el))
    }

    // (b) 画面外
    let io: IntersectionObserver | null = null
    let mo: MutationObserver | null = null

    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            // class ではなく属性で印を付ける。class は React が管理していて、
            // ここで触ると hydration の不一致になる（実際に警告が出た）。
            // data-* は React が差分を取らないので安全。
            e.target.toggleAttribute('data-inview', e.isIntersecting)
          }
        },
        { rootMargin: '10% 0px' },
      )

      const observed = new WeakSet<Element>()
      const scan = () => {
        document.querySelectorAll(LOOPING).forEach((el) => {
          if (observed.has(el)) return
          observed.add(el)
          io!.observe(el)
        })
      }
      scan()

      // 後から差し込まれた要素も拾う（一覧の追加読み込みなど）
      mo = new MutationObserver(scan)
      mo.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      body.classList.remove('paused')
      io?.disconnect()
      mo?.disconnect()
      rise?.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [])

  return null
}
