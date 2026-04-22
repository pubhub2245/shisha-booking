import Link from 'next/link'
import { Header } from '@/components/alpha/Header'
import { Footer } from '@/components/alpha/Footer'
import { Button } from '@/components/alpha/Button'

export default function ReserveCompletePage() {
  return (
    <>
      <Header />
      <main
        className="min-h-screen flex items-center justify-center px-[clamp(20px,4vw,48px)]"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="max-w-[560px] w-full text-center py-[160px]">
          {/* Gold circle with check */}
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-[40px]"
            style={{ border: '1px solid var(--color-gold)' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="var(--color-gold)" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="eyebrow" style={{ color: 'var(--color-gold-light)' }}>― Reservation Received</span>

          <h1
            className="font-light tracking-[0.06em] leading-[1.5] mt-[18px] mb-[32px]"
            style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)' }}
          >
            ご予約を受け付けました
          </h1>

          <div className="hr-gold mx-auto mb-[40px]" />

          <p className="text-[0.95rem] leading-[2.1] tracking-[0.04em] mb-[48px]" style={{ color: 'rgb(239 231 215 / 0.75)' }}>
            ご予約ありがとうございます。<br />
            内容を確認のうえ、折り返しご連絡いたします。
          </p>

          {/* Next steps */}
          <div className="text-left max-w-[400px] mx-auto mb-[56px]">
            <span className="eyebrow block mb-[24px]" style={{ color: 'var(--color-gold-light)' }}>― Next Steps</span>
            <div className="grid gap-[24px]">
              <CompleteStep num="i." text="スタッフが予約内容を確認いたします。" />
              <CompleteStep num="ii." text="お電話またはSNSにて、ご連絡を差し上げます。" />
              <CompleteStep num="iii." text="当日、ご指定の場所にお伺いいたします。" />
            </div>
          </div>

          <Button href="/" variant="inverted">
            トップページに戻る <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  )
}

function CompleteStep({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex gap-[18px] items-start" style={{ borderBottom: '1px solid rgb(239 231 215 / 0.1)', paddingBottom: '24px' }}>
      <span
        className="italic text-[0.88rem] tracking-[0.1em] pt-[2px] flex-shrink-0"
        style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}
      >
        {num}
      </span>
      <p className="text-[0.93rem] leading-[1.9]" style={{ color: 'rgb(239 231 215 / 0.75)' }}>{text}</p>
    </div>
  )
}
