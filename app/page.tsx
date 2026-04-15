import Link from 'next/link'
import FAQ from './_components/faq'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <span className="text-lg font-bold tracking-tight">出張シーシャ</span>
        <Link
          href="/admin/login"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          管理者ログイン
        </Link>
      </header>

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
            className="mt-4 text-sm text-gray-400 hover:text-gray-200 underline underline-offset-4 transition-colors"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StepCard n={1} title="Webで予約" />
            <StepCard n={2} title="確認のご連絡" />
            <StepCard n={3} title="当日出張" />
            <StepCard n={4} title="シーシャ提供" />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-24 w-full max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">よくあるご質問</h2>
          <FAQ />
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-3 text-gray-400 hover:text-white transition-colors"
        >
          Instagram
        </a>
        <div>&copy; 2026 株式会社Alpha. All rights reserved.</div>
      </footer>
    </div>
  )
}

function AreaCard({ label, sub, muted }: { label: string; sub: string; muted?: boolean }) {
  return (
    <div className={`rounded-xl p-6 border text-center ${muted ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-white/10 border-white/20'}`}>
      <div className="font-bold text-lg">{label}</div>
      <div className="text-sm mt-1 opacity-80">{sub}</div>
    </div>
  )
}

function StepCard({ n, title }: { n: number; title: string }) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10 text-center">
      <div className="w-9 h-9 mx-auto rounded-full bg-amber-500 text-white font-bold flex items-center justify-center mb-3">{n}</div>
      <div className="font-medium text-sm">{title}</div>
    </div>
  )
}
