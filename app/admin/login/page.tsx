'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      console.error('[login] auth error:', authError)
      const code = authError?.code || ''
      const msg = authError?.message || ''
      if (code === 'invalid_credentials' || /invalid login/i.test(msg)) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (code === 'email_not_confirmed' || /not confirmed/i.test(msg)) {
        setError('メールアドレスが未確認です。確認メールをご確認ください')
      } else {
        setError(`ログインに失敗しました${msg ? `: ${msg}` : ''}`)
      }
      setIsLoading(false)
      return
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()
    if (profileError) {
      console.error('[login] profile fetch error:', profileError)
      setError(`プロフィール取得に失敗しました: ${profileError.message}`)
      setIsLoading(false)
      return
    }
    if (!profile) {
      console.warn('[login] profile row missing for user', data.user.id)
      setError('アカウントにロールが設定されていません。管理者にお問い合わせください')
      setIsLoading(false)
      return
    }
    router.push(profile.role === 'admin' ? '/admin' : '/staff')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">管理者ログイン</h1>
          <p className="text-gray-400 text-sm mt-1">出張シーシャ予約システム</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
