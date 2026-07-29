'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type AuthState = { error: string } | null

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'メールアドレスとパスワードを入力してください。' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。' }

  revalidatePath('/', 'layout')
  redirect(safeNext(formData.get('next')))
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'メールアドレスとパスワードを入力してください。' }
  if (password.length < 6) return { error: 'パスワードは6文字以上にしてください。' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes('registered')) {
      return { error: 'このメールアドレスは既に登録されています。' }
    }
    return { error: 'アカウント作成に失敗しました。時間をおいて再度お試しください。' }
  }

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
