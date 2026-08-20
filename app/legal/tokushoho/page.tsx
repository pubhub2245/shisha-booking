import Link from 'next/link'
import { legalInfo, paidSalesEnabled } from '@/lib/legal'

export const dynamic = 'force-dynamic'
export const metadata = { title: '特定商取引法に基づく表記' }

/**
 * 特定商取引法に基づく表記。
 * 一般UIには開発者向けの情報（環境変数名・未設定警告）を出さない。
 * 事業者情報は環境変数から読み、未設定の値をコード側で捏造しない。
 * 有料販売を提供していない間は、その事実をそのまま表示する。
 */
export default function TokushohoPage() {
  const info = legalInfo()
  const paid = paidSalesEnabled()
  const hasOperator = !!(info.operator && info.address && info.email)

  // 有料販売を行っておらず事業者情報も未登録の場合は、販売条件を並べない
  // （提供していない販売について書くと、実運用と矛盾するため）。
  if (!paid && !hasOperator) {
    return (
      <div className="wrap max-w-2xl py-10">
        <h1 className="text-2xl" style={{ fontWeight: 800 }}>特定商取引法に基づく表記</h1>
        <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          現在、煙道では有料コンテンツの販売や、当サイトを通じた商品の直接販売は行っておりません。
          そのため、特定商取引法に基づく表記の対象となる取引はありません。
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          フレーバーの購入リンクは外部の販売サイトへの案内であり、購入契約はリンク先の各販売事業者との間で成立します。
          販売条件・返品等については、各販売サイトの表記をご確認ください。
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          有料機能の提供を開始する際は、本ページに事業者情報および販売条件を掲載します。
        </p>
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/legal/terms" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>利用規約</Link>
          <Link href="/legal/privacy" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>プライバシーポリシー</Link>
        </div>
      </div>
    )
  }

  // 設定済みの項目だけを表示する（未設定を「（未設定）」と見せない）
  const rows: { k: string; v: string }[] = []
  if (info.operator) rows.push({ k: '販売事業者', v: info.operator })
  if (info.manager) rows.push({ k: '運営統括責任者', v: info.manager })
  if (info.address) rows.push({ k: '所在地', v: info.address })
  if (info.phone) rows.push({ k: '電話番号', v: info.phone })
  if (info.email) rows.push({ k: 'メールアドレス', v: info.email })
  rows.push(
    { k: '販売価格', v: '各有料ノートのページに税込価格を表示します。' },
    { k: '商品以外の必要料金', v: 'なし（インターネット接続料金・通信料はお客様のご負担となります）。' },
    { k: 'お支払い方法', v: 'クレジットカード決済（Stripe）。' },
    { k: 'お支払い時期', v: 'ご購入手続き時に即時決済されます。' },
    { k: '商品の引渡し時期', v: '決済完了後、ただちに該当コンテンツの閲覧が可能になります。' },
    {
      k: '返品・キャンセル',
      v: 'デジタルコンテンツの性質上、決済完了後の返品・キャンセルはお受けできません。内容に不備がある場合は上記の連絡先までご連絡ください。',
    },
    { k: '動作環境', v: '一般的なウェブブラウザで閲覧できます。' }
  )

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>特定商取引法に基づく表記</h1>
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
