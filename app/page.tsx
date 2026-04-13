import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <span className="text-lg font-bold tracking-tight">Shisha Booking</span>
        <Link
          href="/admin/login"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          管理者ログイン
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center px-4 pt-24 pb-32">
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

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <Card title="簡単予約" description="フォームから日時・場所を入力するだけ。最短翌日対応。" />
          <Card title="出張対応" description="宮崎県内のご指定の場所にお伺いします。" />
          <Card title="豊富なフレーバー" description="定番から季節限定まで、お好みに合わせてご用意。" />
        </div>
      </main>

      <footer className="text-center py-8 text-gray-500 text-sm">
        &copy; 2026 Shisha Booking. All rights reserved.
      </footer>
    </div>
  )
}

function Card({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
