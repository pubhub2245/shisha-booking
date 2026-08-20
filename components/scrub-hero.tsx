'use client'

import { useEffect, useRef } from 'react'

/**
 * スクロールで駒送りするヒーロー。
 *
 * 縦に長い領域を用意し、その中を貼り付いた1画面が動かずに居座る。
 * スクロールがどこまで進んだか（0→1）が、そのまま動画の再生位置になる。
 * 下へ送る＝トングが下りて炭が置かれる。動きとスクロールの向きを一致させている。
 *
 * 守っている決まり（どれも外すと目に見えて落ちる）:
 * - 動画は Blob で丸ごと取る。部分取得に対応していない配信元だと、
 *   seek が全部 0 に落ちてスクラブが死ぬ。ローカルでは動くので気づきにくい
 * - スクロール値を currentTime に直接書かない。追従させ、追いついたら休む
 * - seek は1本ずつ。前の seek が終わる前に書くと Chrome で目に見えてガタつく
 * - DOM への書き込みは値が変わったときだけ
 * - 動画が来なくてもページは完成している。ポスターの上で全部読める
 * - 五つの門（スマホ・縦持ちタブレット・粗いポインタ縦・寝かせたスマホ・
 *   動きが苦手な設定）では動画を読み込まない。門は CSS と字句まで一致させる
 */

/** 静止に落とす門。CSS 側と文字ごと一致させること。 */
const GATES = [
  '(prefers-reduced-motion: reduce)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
]

/** 縦に切り出した資産を配る条件。CSS の器の高さと同じ境目にしてある。 */
const PORTRAIT = '(max-width: 760px)'

const RING_C = 126 // 半径20の円周

export type Beat = {
  /** この帯が受け持つスクロールの区間 [開始, 終了]（0..1） */
  band: [number, number]
  /** 帯を沈める楕円の横位置。文字を置いた側に寄せる */
  sx?: string
  /** 組み上がりにかける長さ（既定より savor したいときだけ） */
  ramp?: number
}

export type Source = { src: string; type: string; bytes: number }
export type Cut = { sources: Source[]; poster: string }

export function ScrubHero({
  wide,
  tall,
  beats,
  children,
}: {
  /** 横画面に配る一式。形式は対応している方を上から選ぶ */
  wide: Cut
  /** 縦画面に配る一式。横長のコマをそのまま縦に敷かないための切り出し */
  tall: Cut
  beats: Beat[]
  children: React.ReactNode
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
  const beatsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const video = videoRef.current
    const posterEl = posterRef.current
    if (!root || !stage || !video || !posterEl) return

    const bandEls = Array.from(beatsRef.current?.querySelectorAll<HTMLElement>('.beat') ?? [])
    // 帯ごとの直近値のキャッシュ。毎フレーム書かないために持つ
    const cache = bandEls.map(() => ({ op: -1, k: -1 }))

    let target = 0
    let shown = 0
    let raf: number | null = null
    let last = 0
    let onScreen = true
    let scrubOn = false
    let inited = false
    let loadStart = 0
    let seekBusy = false
    let pendingTime: number | null = null

    // ---- スクロール位置（0..1） ----
    const progress = () => {
      const r = root.getBoundingClientRect()
      const range = r.height - window.innerHeight
      if (range <= 0) return 0
      return Math.min(1, Math.max(0, -r.top / range))
    }

    // ---- seek は1本ずつ。新しい要求は最新だけ残す ----
    const requestSeek = (t: number) => {
      if (!video.duration || Number.isNaN(video.duration)) return
      if (seekBusy) { pendingTime = t; return }
      seekBusy = true
      video.currentTime = t
    }
    const onSeeked = () => {
      seekBusy = false
      if (pendingTime !== null) {
        const t = pendingTime
        pendingTime = null
        requestSeek(t)
      }
    }
    const onVideoError = () => { // 詰まりの逃げ道。ここが無いと二度と seek できなくなる
      seekBusy = false
      pendingTime = null
      failVideo()
    }

    // ---- 帯の表示（値が変わったときだけ書く） ----
    const smoothstep = (p: number, e0: number, e1: number) => {
      const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)))
      return t * t * (3 - 2 * t)
    }
    const paintBeats = (p: number) => {
      for (let i = 0; i < bandEls.length; i++) {
        const el = bandEls[i]
        const a = Number(el.dataset.a)
        const b = Number(el.dataset.b)
        const f = Math.min(0.02, (b - a) / 3)
        const first = i === 0
        const lastBand = i === bandEls.length - 1
        const inOp = first ? 1 : smoothstep(p, a, a + f)
        const outOp = lastBand ? 1 : 1 - smoothstep(p, b - f, b)
        const op = Math.round(inOp * outOp * 1000) / 1000

        const ramp = Number(el.dataset.ramp) || Math.min(0.025, (b - a) * 0.35)
        let k = Math.min(1, Math.max(0, (p - a) / ramp))
        // 最初の帯は、読み込み直後に時間で組み上がってからスクロールへ渡す
        if (first) k = Math.max(k, loadK())
        k = Math.round(k * 125) / 125 // 0.008 刻み

        const c = cache[i]
        if (op !== c.op) { c.op = op; el.style.opacity = `${op}` }
        if (k !== c.k) { c.k = k; el.style.setProperty('--k', `${k}`) }
      }
      const cue = stage.querySelector<HTMLElement>('.scrub-cue')
      if (cue) cue.style.setProperty('--p', `${Math.round(p * 100) / 100}`)
    }

    // 最初の帯だけ、開いた瞬間に一度だけ時間で組み上がる
    const LOAD_MS = 900
    const loadK = () => {
      if (!loadStart) return 0
      return Math.min(1, (performance.now() - loadStart) / LOAD_MS)
    }

    // ---- 追従して、追いついたら休む ----
    const tick = (now: number) => {
      const dt = Math.min(100, now - (last || now))
      last = now
      const k = 0.16
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667))
      const settledMotion = Math.abs(target - shown) < 0.0005
      const settledLoad = loadK() >= 1
      if (settledMotion) { shown = target }
      paintBeats(shown)
      if (video.duration) requestSeek(shown * video.duration * 0.999)
      if (settledMotion && settledLoad) { raf = null; last = 0; return }
      raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!scrubOn || !onScreen) return
      if (raf === null) raf = requestAnimationFrame(tick)
    }
    const onScroll = () => { target = progress(); kick() }

    // ---- 動画（Blob で丸ごと取る） ----
    let started = false
    const failVideo = () => { stage.classList.add('video-failed') }

    // 再生できる形式を選ぶ。ここを固定にすると、H.264 を積んでいないブラウザで
    // スクラブが丸ごと死ぬ（実際に検証環境で死んだ）
    // どの切り出しを配るかは読み込み時に一度だけ決める。
    // 途中で回転しても差し替えない（もう落とした動画を捨ててもう一本落とすのは
    // 通信の無駄で、cover で切れば見た目は成立するため）。
    const cut = () => (window.matchMedia(PORTRAIT).matches ? tall : wide)
    const pick = (c: Cut) => {
      for (const s of c.sources) if (video.canPlayType(s.type)) return s
      return null
    }

    const loadBlob = async () => {
      const chosen = pick(cut())
      if (!chosen) { failVideo(); return }
      const ctrl = new AbortController()
      let watchdog = window.setTimeout(() => ctrl.abort(), 20000)
      try {
        const res = await fetch(chosen.src, { signal: ctrl.signal })
        if (!res.ok || !res.body) throw new Error('no body')
        const total = Number(res.headers.get('Content-Length')) || chosen.bytes
        const reader = res.body.getReader()
        const chunks: BlobPart[] = []
        let got = 0
        let lastRing = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          window.clearTimeout(watchdog)
          watchdog = window.setTimeout(() => ctrl.abort(), 20000)
          chunks.push(value as BlobPart)
          got += value.byteLength
          const frac = Math.min(1, got / total)
          const now = performance.now()
          if (now - lastRing > 100 || frac === 1) {
            lastRing = now
            ringRef.current?.style.setProperty('--ld', `${Math.round(RING_C * (1 - frac))}`)
          }
        }
        window.clearTimeout(watchdog)
        ringRef.current?.style.setProperty('--ld', '0')
        video.src = URL.createObjectURL(new Blob(chunks, { type: chosen.type.split(';')[0] }))
        video.load()
        video.addEventListener('canplay', () => {
          requestSeek(progress() * video.duration * 0.999)
          stage.classList.add('video-ready')
        }, { once: true })
      } catch {
        window.clearTimeout(watchdog)
        failVideo()
      }
    }

    const startBlob = () => { if (started) return; started = true; void loadBlob() }

    const initOnce = () => {
      if (inited) return
      inited = true
      loadStart = performance.now()
      const poster = cut().poster
      posterEl.style.backgroundImage = `url("${poster}")`
      // ポスターが先に出てから動画を取りに行く（帯域の順番を決める）
      const img = new Image()
      img.onload = startBlob
      img.onerror = startBlob
      img.src = poster
      window.setTimeout(startBlob, 4000) // ポスターが詰まっても動画を待たせない
    }

    // ---- 五つの門。CSS と同じ文字列で判断する ----
    const mqls = GATES.map((q) => window.matchMedia(q))
    const enable = () => {
      if (scrubOn) return
      scrubOn = true
      initOnce()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      cache.forEach((c) => { c.op = -1; c.k = -1 }) // 固定した見た目を必ず書き直させる
      onScroll()
    }
    const disable = () => {
      if (!scrubOn) return
      scrubOn = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf !== null) { cancelAnimationFrame(raf); raf = null }
    }
    const applyMode = () => { if (mqls.some((m) => m.matches)) disable(); else enable() }
    mqls.forEach((m) => m.addEventListener('change', applyMode))

    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => {
          onScreen = e.isIntersecting
          if (onScreen) kick()
          else if (raf !== null) { cancelAnimationFrame(raf); raf = null }
        }, { rootMargin: '10% 0px' })
      : null
    io?.observe(root)

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onVideoError)

    applyMode()

    return () => {
      disable()
      mqls.forEach((m) => m.removeEventListener('change', applyMode))
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onVideoError)
      io?.disconnect()
      if (video.src.startsWith('blob:')) URL.revokeObjectURL(video.src)
    }
  }, [wide, tall])

  return (
    <div className="scrub" ref={rootRef}>
      <div className="scrub-stage" ref={stageRef}>
        <div className="scrub-poster" ref={posterRef} aria-hidden="true" />
        <video
          className="scrub-video"
          ref={videoRef}
          preload="none"
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="scrub-scrim" aria-hidden="true" />

        <div ref={beatsRef}>
          {beats.map((b, i) => (
            <div
              key={i}
              className="beat"
              data-a={b.band[0]}
              data-b={b.band[1]}
              data-ramp={b.ramp}
              style={{ ['--sx' as string]: b.sx ?? '32%' }}
            >
              <div className="beat-inner">{Array.isArray(children) ? children[i] : children}</div>
            </div>
          ))}
        </div>

        <svg className="scrub-ring" viewBox="0 0 48 48" aria-hidden="true">
          <circle
            ref={ringRef}
            cx="24" cy="24" r="20" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeDasharray={RING_C}
            style={{ strokeDashoffset: 'var(--ld, 126)' }}
          />
        </svg>

        <span className="scrub-cue" aria-hidden="true">SCROLL</span>
      </div>
    </div>
  )
}
