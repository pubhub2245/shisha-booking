export const dynamic = 'force-dynamic'
export const metadata = { title: '特定商取引法に基づく表記 — 煙道' }

const PLACEHOLDER = '（未設定）'
function env(name: string): string {
  return process.env[name] || PLACEHOLDER
}

export default function TokushohoPage() {
  const operator = env('LEGAL_OPERATOR')
  const manager = env('LEGAL_MANAGER')
  const address = env('LEGAL_ADDRESS')
  const phone = env('LEGAL_PHONE')
  const email = env('LEGAL_EMAIL')
  const incomplete = [operator, manager, address, phone, email].some((v) => v === PLACEHOLDER)

  const rows: { k: string; v: string }[] = [
    { k: '販売事業者', v: operator },
    { k: '運営統括責任者', v: manager },
    { k: '所在地', v: address },
    { k: '電話番号', v: phone },
    { k: 'メールアドレス', v: email },
    { k: '販売価格', v: '各有料ノートのページに税込価格を表示します。' },
    { k: '商品以外の必要料金', v: 'なし（インターネット接続料金・通信料はお客様のご負担となります）。' },
    { k: 'お支払い方法', v: 'クレジットカード決済（Stripe）。' },
    { k: 'お支払い時期', v: 'ご購入手続き時に即時決済されます。' },
    { k: '商品の引渡し時期', v: '決済完了後、ただちに該当コンテンツの閲覧が可能になります。' },
    {
      k: '返品・キャンセル',
      v: 'デジタルコンテンツの性質上、決済完了後の返品・キャンセルはお受けできません。内容に不備がある場合は下記メールまでご連絡ください。',
    },
    { k: '動作環境', v: '一般的なウェブブラウザで閲覧できます。' },
  ]

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>特定商取引法に基づく表記</h1>
      {incomplete && (
        <div className="mt-4 rounded-xl border px-4 py-3 text-xs" style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(224 85 42 / 0.08)', color: 'var(--color-ember-hot)' }}>
          ⚠️ 事業者情報が未設定です。Vercel の環境変数
          <b> LEGAL_OPERATOR / LEGAL_MANAGER / LEGAL_ADDRESS / LEGAL_PHONE / LEGAL_EMAIL </b>
          を設定すると反映されます（有料販売の開始前に必須）。
        </div>
      )}
      <dl className="mt-6 flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
        {rows.map((r) => (
          <div key={r.k} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]" style={{ borderColor: 'var(--line)' }}>
            <dt className="text-sm" style={{ fontWeight: 700 }}>{r.k}</dt>
            <dd className="text-sm" style={{ color: 'var(--color-ash)' }}>{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
