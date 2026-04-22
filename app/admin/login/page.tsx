'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/alpha/Button'

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
      setError('Login failed. Please check your credentials.')
      setIsLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/admin' : '/staff')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-[clamp(20px,4vw,48px)]"
      style={{ background: 'var(--color-paper)' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-[48px]">
          <div className="flex items-baseline justify-center gap-[0.55em] mb-[16px]" style={{ fontFamily: 'var(--font-serif-en)' }}>
            <span className="text-[1.4rem] font-normal tracking-[0.02em]">Alpha</span>
            <span
              className="w-[6px] h-[6px] rounded-full mx-[2px]"
              style={{ background: 'var(--color-gold)', transform: 'translateY(-2px)', boxShadow: '0 0 14px rgb(168 133 58 / 0.5)' }}
            />
            <span className="text-[1.4rem] font-light italic" style={{ color: 'var(--ink-75)' }}>Lounge</span>
          </div>
          <span className="eyebrow">― Admin</span>
        </div>

        {/* Form card */}
        <div style={{ border: '1px solid var(--color-line-soft)', padding: 'clamp(32px, 5vw, 48px)' }}>
          <form onSubmit={handleLogin} className="grid gap-0">
            <div className="reserve-field flex flex-col gap-[8px] py-[22px]" style={{ borderBottom: '1px solid var(--color-line-soft)' }}>
              <label
                className="italic text-[0.82rem] tracking-[0.14em]"
                style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="reserve-field flex flex-col gap-[8px] py-[22px]" style={{ borderBottom: '1px solid var(--color-line-soft)' }}>
              <label
                className="italic text-[0.82rem] tracking-[0.14em]"
                style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="mt-[20px] px-[16px] py-[12px] text-[0.88rem] leading-[1.7]"
                style={{
                  border: '1px solid rgb(180 60 60 / 0.3)',
                  color: '#a04040',
                  background: 'rgb(180 60 60 / 0.06)',
                }}
              >
                {error}
              </div>
            )}

            <div className="mt-[32px]">
              <Button type="submit" variant="gold" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}{' '}
                <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
