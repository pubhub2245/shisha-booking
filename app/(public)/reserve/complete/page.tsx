import Link from 'next/link'

export default function CompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">&#x2714;&#xFE0F;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">予約を受け付けました</h1>
        <p className="text-gray-600 mb-8">
          ご予約ありがとうございます。<br />
          内容を確認のうえ、折り返しご連絡いたします。
        </p>
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          トップに戻る
        </Link>
      </div>
    </div>
  )
}
