import { legalEmail, paidSalesEnabled } from '@/lib/legal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'プライバシーポリシー — 煙道' }

export default function PrivacyPage() {
  const email = legalEmail()
  const paid = paidSalesEnabled()

  // 記載は実際に取得している情報と一致させる。
  // 取得していないもの（例：未提供の決済）を書かない／取得しているもの（体験・味覚・アクセス解析）を落とさない。
  const sections: { h: string; b: string }[] = [
    {
      h: '1. 取得する情報',
      b:
        'アカウント登録時のメールアドレス、プロフィール情報（表示名・ユーザー名・自己紹介・アイコン）、' +
        '投稿内容（ミックス・作り方・写真・コメント）、いいね・保存・フォロー等の利用状況、' +
        '「吸った」「作った」等の体験記録とその評価（満足度・味覚の5軸）、' +
        'お持ちのフレーバー（マイフレーバー）、フレーバー購入リンクのクリック等のアクセス情報を取得します。' +
        (paid ? '有料コンテンツの購入・解錠履歴を取得します。' : ''),
    },
    {
      h: '2. 利用目的',
      b:
        '本サービスの提供・維持・改善、本人確認、不正利用の防止、機能の改善や新機能の検討、' +
        'ミックスごとの集計（吸われた回数・再現回数・味覚の平均等）の作成、' +
        'フレーバー購入リンクの成果計測のために利用します。',
    },
    {
      h: '3. 体験記録の公開範囲',
      b:
        '「吸った」「作った」等の個別の体験記録と、ご自身が入力した味覚評価は、ご本人のみが閲覧できます。' +
        '他の利用者に表示されるのは、人数や回数、平均値などの集計結果のみで、誰がいつ記録したかは公開されません。',
    },
    {
      h: '4. 第三者提供',
      b:
        '法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。' +
        (paid ? '決済処理のため Stripe に必要な情報を送信します。' : ''),
    },
    {
      h: '5. 外部サービス',
      b:
        '認証・データ保存に Supabase、ホスティングとアクセス解析に Vercel（Vercel Analytics）を利用します。' +
        (paid ? '決済に Stripe を利用します。' : '') +
        '各社のプライバシーポリシーが適用されます。',
    },
    { h: '6. Cookie 等', b: 'ログイン状態の維持や年齢確認の記録のために Cookie 等を使用します。' },
    {
      h: '7. 開示・訂正・削除',
      b:
        'プロフィールや投稿、体験の記録は、ログイン後にご自身で編集・削除できます。' +
        (email
          ? `その他、登録情報の確認・訂正・削除をご希望の場合は、${email} までご連絡ください。`
          : 'その他、登録情報の確認・訂正・削除をご希望の場合は、運営までご連絡ください。'),
    },
    { h: '8. 改定', b: '本ポリシーは必要に応じて改定されます。重要な変更はサービス上で告知します。' },
  ]

  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>プライバシーポリシー</h1>
      <div className="mt-6 flex flex-col gap-5">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-sm" style={{ fontWeight: 700 }}>{s.h}</h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{s.b}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
