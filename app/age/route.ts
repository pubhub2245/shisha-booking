import { NextResponse, type NextRequest } from 'next/server'
import {
  AGE_NG_COOKIE,
  AGE_NG_MAX_AGE,
  AGE_OK_COOKIE,
  AGE_OK_MAX_AGE,
  isOldEnough,
  safeNextPath,
} from '@/lib/age'

/**
 * 年齢確認の受け口（JS が動かない環境用）。
 * 画面側の <form method="post" action="/age"> がここへ来る。JS が動くときは
 * 画面側がクッキーを直接書くので、ここは通らない。
 * 判定の計算は lib/age.ts に1つだけ置き、画面と同じものを使う。
 */
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const next = safeNextPath(form.get('next'))
  const res = NextResponse.redirect(new URL(next, request.url), 303)
  if (isOldEnough(form.get('year'), form.get('month'))) {
    res.cookies.set(AGE_OK_COOKIE, '1', { path: '/', maxAge: AGE_OK_MAX_AGE, sameSite: 'lax' })
    res.cookies.set(AGE_NG_COOKIE, '', { path: '/', maxAge: 0 })
  } else {
    res.cookies.set(AGE_NG_COOKIE, '1', { path: '/', maxAge: AGE_NG_MAX_AGE, sameSite: 'lax' })
  }
  return res
}
