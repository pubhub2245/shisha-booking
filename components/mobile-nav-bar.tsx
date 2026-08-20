'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconLeaf, IconSmoke, IconCoal, IconSearch, IconUser } from '@/components/nav-icons'

type Item = { href: string; icon: React.ReactNode; label: string }

/** 中央の丸ボタン。煙道の主行動＝「今日の一台を記録する」 */
const CENTER = '/record'

/**
 * 下部ナビの本体（現在地ハイライト付き）。isAuthed はサーバー側から渡す。
 *
 * 枠は5つしかないので、いま最も強く押したい行動だけを置く。
 *  - 中央は「投稿」ではなく「記録」。煙道の主行動は自分の作り方を出すことではなく、
 *    他人の作り方を試して残すこと。投稿は /record・/theme・マイ煙道から到達できる
 *  - 「王道」は現時点で0件なので枠を持たせない（空のタブを常設しない）。
 *    代わりに「検証」＝いま実際に進んでいる場所を置く
 */
export function MobileNavBar({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname()
  const items: Item[] = [
    { href: '/', icon: <IconLeaf />, label: 'フレーバー' },
    { href: '/theme', icon: <IconSmoke />, label: '今月' },
    { href: CENTER, icon: <IconCoal />, label: '記録' },
    { href: '/search', icon: <IconSearch />, label: '検索' },
    isAuthed ? { href: '/mypage', icon: <IconUser />, label: 'マイ煙道' } : { href: '/login', icon: <IconUser />, label: 'ログイン' },
  ]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
      style={{ borderColor: 'var(--line)', background: 'var(--surface-blur-strong)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-stretch justify-around">
        {items.map((it) => {
          const active = isActive(it.href)

          // 中央は浮き出た丸ボタンで強調する
          if (it.href === CENTER) {
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-label="今日の一台を記録する"
                aria-current={active ? 'page' : undefined}
                className="flex flex-1 flex-col items-center justify-start"
              >
                <span
                  className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95"
                  style={{
                    background: 'var(--color-ember)',
                    color: 'var(--on-fill)',
                    boxShadow: '0 8px 18px -8px rgb(79 157 120 / 0.7)',
                    border: '3px solid var(--surface)',
                  }}
                  aria-hidden
                >
                  <IconCoal size={22} />
                </span>
                <span className="mt-0.5 text-[0.68rem]" style={{ color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)', fontWeight: active ? 700 : 400 }}>
                  {it.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] transition-colors"
              style={{ color: active ? 'var(--color-ember-hot)' : 'var(--color-ash)', fontWeight: active ? 700 : 400 }}
            >
              <span className="flex h-5 items-center leading-none" aria-hidden>{it.icon}</span>
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
