import Link from 'next/link'
import SiteHeader from '@/app/_components/site-header'

export default function CompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#x2714;&#xFE0F;</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            ご予約ありがとうございます！
          </h1>
          <p className="text-gray-200 mb-3">
            予約内容を確認し、折り返しご連絡いたします。
          </p>
          <p className="text-gray-400 text-sm mb-8">
            変更・キャンセルはInstagram DMにてご連絡ください。
          </p>
          <Link
            href="/"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
