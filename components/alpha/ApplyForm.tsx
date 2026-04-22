'use client'

import { useState } from 'react'
import { Button } from './Button'

export function ApplyForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    console.log('Apply form data:', data)
    setSubmitted(true)
    alert('お申込ありがとうございます。\n\n※現在はモックアップ動作です。後日、正式な送信処理に接続されます。')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-x-[30px] max-[900px]:grid-cols-1"
    >
      <Field label="Name" jp="お名前" required>
        <input type="text" name="name" placeholder="e.g. 山田 太郎" required />
      </Field>
      <Field label="Company" jp="会社名 / 屋号" required>
        <input type="text" name="company" placeholder="e.g. 株式会社〇〇" required />
      </Field>
      <Field label="Industry" jp="業種" required>
        <select name="industry" required defaultValue="">
          <option value="" disabled>選択してください</option>
          <option>飲食 ・ バー ・ ホテル</option>
          <option>不動産 ・ 建設</option>
          <option>美容 ・ サロン</option>
          <option>士業 ・ コンサル</option>
          <option>IT ・ Web</option>
          <option>医療 ・ 福祉</option>
          <option>製造 ・ 流通</option>
          <option>その他</option>
        </select>
      </Field>
      <Field label="E-mail" jp="メールアドレス" required>
        <input type="email" name="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Phone" jp="お電話番号" required>
        <input type="tel" name="phone" placeholder="090-0000-0000" required />
      </Field>
      <Field label="Area" jp="ご希望エリア" required>
        <select name="area" required defaultValue="">
          <option value="" disabled>選択してください</option>
          <option>宮崎市内</option>
          <option>都城市内</option>
          <option>県内 その他</option>
          <option>県外 / 将来の拡大エリアに興味あり</option>
        </select>
      </Field>
      <Field label="Scenes" jp="想定の利用シーン" full>
        <textarea name="scenes" rows={3} placeholder="e.g. 接待 / 周年パーティ / 自店舗の演出 / 会場提携のご相談 など、自由にお書きください。" />
      </Field>
      <Field label="Referrer" jp="ご紹介者様 ・ 任意" full>
        <input type="text" name="referrer" placeholder="ご紹介者様のお名前がございましたら" />
      </Field>

      {/* Consent */}
      <label className="col-span-full flex items-start gap-[14px] pt-[32px] text-[0.9rem] leading-[1.9]" style={{ color: 'rgb(239 231 215 / 0.85)' }}>
        <input
          type="checkbox"
          required
          className="appearance-none w-[18px] h-[18px] mt-[3px] flex-shrink-0 cursor-pointer relative transition-colors duration-300"
          style={{
            border: '1px solid var(--color-gold-light)',
            background: 'transparent',
          }}
          onChange={(e) => {
            const el = e.currentTarget
            if (el.checked) {
              el.style.background = 'var(--color-gold)'
              el.style.borderColor = 'var(--color-gold)'
            } else {
              el.style.background = 'transparent'
              el.style.borderColor = 'var(--color-gold-light)'
            }
          }}
        />
        <span>
          <a href="#" className="transition-colors" style={{ color: 'var(--color-gold-light)', borderBottom: '1px solid var(--color-gold-light)', paddingBottom: '1px' }}>利用規約</a>
          および
          <a href="#" className="transition-colors" style={{ color: 'var(--color-gold-light)', borderBottom: '1px solid var(--color-gold-light)', paddingBottom: '1px' }}>プライバシーポリシー</a>
          に同意のうえ、Alpha Lounge {'\u03B2'}会員として申込内容を送信します。※審査後、ご案内いたします。
        </span>
      </label>

      {/* Submit */}
      <div className="col-span-full flex items-center gap-[24px] flex-wrap mt-[40px]">
        <Button type="submit" variant="inverted" disabled={submitted}>
          申込内容を送信する <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
        </Button>
        <span
          className="italic text-[0.8rem] tracking-[0.12em]"
          style={{ fontFamily: 'var(--font-serif-en)', color: 'rgb(239 231 215 / 0.5)' }}
        >
          ― ご返信は原則24時間以内
        </span>
      </div>
    </form>
  )
}

/* --- Field wrapper --- */
function Field({
  label,
  jp,
  required,
  full,
  children,
}: {
  label: string
  jp: string
  required?: boolean
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col gap-[8px] py-[22px] ${full ? 'col-span-full' : ''}`}
      style={{ borderBottom: '1px solid rgb(239 231 215 / 0.15)' }}
    >
      <label
        className="italic text-[0.82rem] tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}
      >
        {label}
        <span
          className="not-italic ml-[10px] tracking-[0.08em] font-light"
          style={{ fontFamily: 'var(--font-serif-jp)', color: 'rgb(239 231 215 / 0.75)', fontSize: '0.82rem' }}
        >
          {jp}
        </span>
        {required && <span className="ml-[6px]" style={{ color: 'var(--color-gold)' }}>*</span>}
      </label>
      <div
        className="[&_input]:w-full [&_input]:bg-transparent [&_input]:border-0 [&_input]:border-b [&_input]:border-transparent [&_input]:outline-none [&_input]:py-[6px] [&_input]:text-[1rem] [&_input]:tracking-[0.04em] [&_input]:font-light [&_input]:transition-colors [&_input]:duration-300 focus-within:[&_input]:border-b-[var(--color-gold-light)] [&_select]:w-full [&_select]:bg-transparent [&_select]:border-0 [&_select]:border-b [&_select]:border-transparent [&_select]:outline-none [&_select]:py-[6px] [&_select]:text-[1rem] [&_select]:tracking-[0.04em] [&_select]:font-light [&_select]:appearance-none [&_select]:pr-[28px] [&_select]:transition-colors [&_select]:duration-300 focus-within:[&_select]:border-b-[var(--color-gold-light)] [&_textarea]:w-full [&_textarea]:bg-transparent [&_textarea]:border-0 [&_textarea]:border-b [&_textarea]:border-transparent [&_textarea]:outline-none [&_textarea]:py-[6px] [&_textarea]:text-[1rem] [&_textarea]:tracking-[0.04em] [&_textarea]:font-light [&_textarea]:resize-y [&_textarea]:min-h-[80px] [&_textarea]:transition-colors [&_textarea]:duration-300 focus-within:[&_textarea]:border-b-[var(--color-gold-light)]"
        style={{
          ['--tw-text-opacity' as string]: 1,
        }}
      >
        <style>{`
          .field-inner input, .field-inner select, .field-inner textarea {
            font-family: var(--font-serif-jp);
            color: var(--color-paper);
          }
          .field-inner input::placeholder, .field-inner textarea::placeholder {
            color: rgb(239 231 215 / 0.35);
            font-style: italic;
            font-family: var(--font-serif-en);
            letter-spacing: 0.06em;
          }
          .field-inner select option {
            background: var(--color-ink);
            color: var(--color-paper);
          }
        `}</style>
        <div className="field-inner">
          {children}
        </div>
      </div>
    </div>
  )
}
