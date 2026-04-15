import Link from 'next/link'
import FAQ from './_components/faq'
import SiteHeader from './_components/site-header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <SiteHeader />

      <main className="flex flex-col items-center px-4 pt-20 pb-16">
        <section className="flex flex-col items-center w-full">
          <h1 className="text-4xl md:text-5xl font-bold text-center leading-tight mb-4">
            出張シーシャで<br />特別なひとときを
          </h1>
          <p className="text-gray-400 text-center max-w-md mb-10 text-lg">
            イベント・パーティー・自宅など、お好きな場所にシーシャをお届けします。
          </p>
          <Link
            href="/reserve"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition-colors shadow-lg shadow-amber-500/20"
          >
            予約する
          </Link>
          <Link
            href="/cancel"
            className="mt-5 text-base text-white/90 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
          >
            キャンセルはこちら
          </Link>
        </section>

        {/* 料金 */}
        <section className="mt-24 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">料金</h2>
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10 text-center w-full max-w-sm">
              <h3 className="text-lg font-bold mb-2">電熱式シーシャ</h3>
              <p className="text-3xl font-bold text-amber-400">5,000<span className="text-base font-normal text-gray-400">円（税込）</span></p>
            </div>
          </div>
        </section>

        {/* 対応エリア */}
        <section className="mt-24 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">対応エリア</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AreaCard label="都城市内" sub="牟田町周辺" />
            <AreaCard label="鹿児島市内" sub="天文館周辺" />
            <AreaCard label="宮崎市内" sub="準備中" muted />
          </div>
        </section>

        {/* 利用の流れ */}
        <section className="mt-24 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">ご利用の流れ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StepCard n={1} title="Webで予約" desc="このサイトから日時・場所を入力" />
            <StepCard n={2} title="確認のご連絡" desc="スタッフから確認のご連絡をいたします" />
            <StepCard n={3} title="当日出張" desc="ご指定の場所にシーシャ機材を持って伺います" />
            <StepCard n={4} title="シーシャ提供" desc="セッティング後、シーシャをお楽しみください" />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-24 w-full max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">よくあるご質問</h2>
          <FAQ />
        </section>
      </main>

      <footer className="border-t border-white/10 py-10 px-4 text-center text-gray-400 text-sm">
        <div className="max-w-3xl mx-auto space-y-3">
          <div>お問い合わせ：Instagram DMにてご連絡ください</div>
          <div>
            {/* TODO: ここに実際のアカウントURLを入れる（例: https://www.instagram.com/your_account/） */}
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-200 hover:text-amber-400 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.2.05 1.8.24 2.2.4.6.22 1 .5 1.5 1 .5.5.8.9 1 1.5.16.4.35 1 .4 2.2.07 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.05 1.2-.24 1.8-.4 2.2-.22.6-.5 1-1 1.5-.5.5-.9.8-1.5 1-.4.16-1 .35-2.2.4-1.2.07-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.05-1.8-.24-2.2-.4-.6-.22-1-.5-1.5-1-.5-.5-.8-.9-1-1.5-.16-.4-.35-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.2.24-1.8.4-2.2.22-.6.5-1 1-1.5.5-.5.9-.8 1.5-1 .4-.16 1-.35 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.5 0-4.7.06-1 .05-1.6.22-1.9.36-.5.2-.85.43-1.2.78-.35.35-.58.7-.78 1.2-.14.3-.31.9-.36 1.9C3 8.5 3 8.85 3 12s0 3.5.06 4.7c.05 1 .22 1.6.36 1.9.2.5.43.85.78 1.2.35.35.7.58 1.2.78.3.14.9.31 1.9.36 1.2.06 1.55.06 4.7.06s3.5 0 4.7-.06c1-.05 1.6-.22 1.9-.36.5-.2.85-.43 1.2-.78.35-.35.58-.7.78-1.2.14-.3.31-.9.36-1.9.06-1.2.06-1.55.06-4.7s0-3.5-.06-4.7c-.05-1-.22-1.6-.36-1.9-.2-.5-.43-.85-.78-1.2-.35-.35-.7-.58-1.2-.78-.3-.14-.9-.31-1.9-.36C15.5 4 15.15 4 12 4zm0 3.05a4.95 4.95 0 110 9.9 4.95 4.95 0 010-9.9zm0 1.8a3.15 3.15 0 100 6.3 3.15 3.15 0 000-6.3zm5.15-2.07a1.16 1.16 0 110 2.32 1.16 1.16 0 010-2.32z"/></svg>
              Instagram
            </a>
          </div>
          <div>営業時間：10:00〜22:00</div>
          <div className="pt-2 text-gray-500">&copy; 2026 株式会社Alpha All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

function AreaCard({ label, sub, muted }: { label: string; sub: string; muted?: boolean }) {
  if (muted) {
    return (
      <div className="rounded-xl p-6 border text-center bg-white/5 border-white/10 text-gray-400 cursor-not-allowed">
        <div className="font-bold text-lg">{label}</div>
        <div className="text-sm mt-1 opacity-80">{sub}</div>
      </div>
    )
  }
  return (
    <Link
      href="/reserve"
      className="rounded-xl p-6 border text-center bg-white/10 border-white/20 hover:bg-white/15 hover:border-amber-400/60 transition-colors block"
    >
      <div className="font-bold text-lg">{label}</div>
      <div className="text-sm mt-1 opacity-80">{sub}</div>
      <div className="text-xs mt-2 text-amber-400">予約する →</div>
    </Link>
  )
}

function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10 text-center">
      <div className="w-9 h-9 mx-auto rounded-full bg-amber-500 text-white font-bold flex items-center justify-center mb-3">{n}</div>
      <div className="font-medium text-sm mb-2">{title}</div>
      <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
    </div>
  )
}
