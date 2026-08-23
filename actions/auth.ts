'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { trackServerEvent } from '@/lib/analytics-server'

/** email は失敗したときに入力欄へ戻すためだけに持つ。入れないと打ち直しになる */
export type AuthState = { error: string; email?: string } | { notice: string } | null

/** リクエストヘッダから現在のオリジン（https://host）を組み立てる */
async function currentOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'shisha-booking.vercel.app'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'メールアドレスとパスワードを入力してください。', email }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('not confirmed') || msg.includes('confirm')) {
      return { error: 'メール確認が未完了です。届いた確認メールのリンクをクリックしてからログインしてください。', email }
    }
    return { error: 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。', email }
  }

  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'メールアドレスとパスワードを入力してください。' }
  if (password.length < 6) return { error: 'パスワードは6文字以上にしてください。' }

  const origin = await currentOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) {
    if (error.message.toLowerCase().includes('registered')) {
      return { error: 'このメールアドレスは既に登録されています。ログインするか、パスワードをお忘れの場合は再設定してください。' }
    }
    return { error: 'アカウント作成に失敗しました。時間をおいて再度お試しください。' }
  }

  // 既に登録済みのメール（確認済み）で再登録した場合、Supabase は identities が空のユーザーを返す。
  // 確認メールは再送されないため、ログイン/再設定へ誘導する。
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: 'このメールアドレスは既に登録済みです。ログインしてください（パスワードをお忘れの場合は再設定できます）。' }
  }

  // 計測（PIIなし）。email / username / display_name は一切送らない。
  await trackServerEvent('signup', {})

  // メール確認が必須の場合、session は発行されない → 確認を促す
  if (!data.session) {
    return {
      notice:
        '確認メールを送信しました。メール内のリンクをクリックすると登録が完了し、そのままログインされます。（数分たっても届かない場合は迷惑メールもご確認ください）',
    }
  }

  // 確認不要（即ログイン）の場合
  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

/** オープンリダイレクト防止：アプリ内パスのみ許可 */
function safeNext(raw: FormDataEntryValue | null): string {
  const s = typeof raw === 'string' ? raw : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/'
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

/** パスワード再設定メールを送る */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'メールアドレスを入力してください。' }

  const origin = await currentOrigin()
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  // 存在有無を漏らさないため、常に同じ案内を返す
  return {
    notice:
      'パスワード再設定用のメールを送信しました（登録済みの場合）。メール内のリンクから新しいパスワードを設定してください。数分たっても届かない場合は迷惑メールもご確認ください。',
  }
}

/** ログイン中（回復セッション含む）のユーザーのパスワードを更新 */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '')
  if (password.length < 6) return { error: 'パスワードは6文字以上にしてください。' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'リンクの有効期限が切れている可能性があります。もう一度お試しください。' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'パスワードの更新に失敗しました。時間をおいて再度お試しください。' }

  revalidatePath('/', 'layout')
  redirect('/')
}
