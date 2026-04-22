'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/alpha/Header'
import { Footer } from '@/components/alpha/Footer'
import { Button } from '@/components/alpha/Button'

export default function ReservePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) router.push('/reserve/complete')
      else throw new Error()
    } catch {
      alert('送信に失敗しました')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[140px] pb-[120px] px-[clamp(20px,4vw,48px)]" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
        <div className="max-w-[680px] mx-auto">
          {/* Page heading */}
          <div className="mb-[60px]">
            <span className="eyebrow">― Reservation</span>
            <h1
              className="font-light tracking-[0.06em] leading-[1.5] mt-[14px]"
              style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)' }}
            >
              ご予約フォーム
            </h1>
            <p className="mt-[16px] text-[0.95rem] leading-[2] tracking-[0.04em]" style={{ color: 'var(--ink-75)' }}>
              以下のフォームに入力して送信してください。<br />
              内容を確認のうえ、折り返しご連絡いたします。
            </p>
            <div className="hr-gold mt-[28px]" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-0">
            <ReserveField label="Name" jp="お名前" required>
              <input type="text" name="customer_name" required placeholder="山田 太郎" />
            </ReserveField>

            <ReserveField label="Phone" jp="電話番号" required>
              <input type="tel" name="customer_phone" required placeholder="090-0000-0000" />
            </ReserveField>

            <ReserveField label="SNS" jp="LINE / Instagram（任意）">
              <input type="text" name="customer_sns" placeholder="@username" />
            </ReserveField>

            <div className="grid grid-cols-2 gap-[30px] max-[560px]:grid-cols-1">
              <ReserveField label="Date" jp="ご希望日" required>
                <input type="date" name="reservation_date" required min={new Date().toISOString().split('T')[0]} />
              </ReserveField>

              <ReserveField label="Time" jp="ご希望時間" required>
                <select name="reservation_time" required defaultValue="">
                  <option value="" disabled>選択してください</option>
                  {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                    <option key={t} value={t}>{t}〜</option>
                  ))}
                </select>
              </ReserveField>
            </div>

            <ReserveField label="Area" jp="エリア" required>
              <select name="area" required defaultValue="">
                <option value="" disabled>選択してください</option>
                {['宮崎市内', '都城市内', '延岡市内', 'その他'].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </ReserveField>

            <ReserveField label="Location" jp="ご利用場所" required>
              <input type="text" name="location" required placeholder="提携会場名 または 施設名" />
            </ReserveField>

            <ReserveField label="Quantity" jp="ご希望台数">
              <select name="quantity" defaultValue="1">
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}台</option>
                ))}
              </select>
            </ReserveField>

            <ReserveField label="Flavor" jp="希望フレーバー（任意）">
              <input type="text" name="flavor_request" placeholder="e.g. ダブルアップル、ミント" />
            </ReserveField>

            <ReserveField label="Notes" jp="備考（任意）">
              <textarea name="notes" rows={3} placeholder="ご要望やご質問がありましたら" />
            </ReserveField>

            <div className="flex items-center gap-[24px] flex-wrap mt-[48px]">
              <Button type="submit" variant="gold" disabled={isSubmitting}>
                {isSubmitting ? '送信中...' : '予約を申し込む'}{' '}
                <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
              </Button>
              <span
                className="italic text-[0.8rem] tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }}
              >
                ― 折り返しご連絡いたします
              </span>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}

function ReserveField({
  label,
  jp,
  required,
  children,
}: {
  label: string
  jp: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-[8px] py-[22px] reserve-field"
      style={{ borderBottom: '1px solid var(--color-line-soft)' }}
    >
      <label
        className="italic text-[0.82rem] tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}
      >
        {label}
        <span
          className="not-italic ml-[10px] tracking-[0.08em] font-light"
          style={{ fontFamily: 'var(--font-serif-jp)', color: 'var(--ink-75)', fontSize: '0.82rem' }}
        >
          {jp}
        </span>
        {required && <span className="ml-[6px]" style={{ color: 'var(--color-gold)' }}>*</span>}
      </label>
      <div>
        {children}
      </div>
    </div>
  )
}
