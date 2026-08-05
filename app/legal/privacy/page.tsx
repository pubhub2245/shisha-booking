export const metadata = { title: 'プライバシーポリシー — MixHub' }

export default function PrivacyPage() {
  const sections: { h: string; b: string }[] = [
    { h: '1. 取得する情報', b: 'アカウント登録時のメールアドレス、プロフィール情報（表示名・ユーザー名・自己紹介等）、投稿内容、いいね・保存・フォロー等の利用状況、購入・解錠履歴、リンククリック等のアクセス情報を取得します。' },
    { h: '2. 利用目的', b: '本サービスの提供・維持・改善、本人確認、不正利用の防止、機能の改善や新機能の検討、アフィリエイト成果の計測のために利用します。' },
    { h: '3. 第三者提供', b: '法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。決済処理のため Stripe 等の決済事業者に必要な情報を送信する場合があります。' },
    { h: '4. 外部サービス', b: '認証・データ保存に Supabase、ホスティングに Vercel、決済に Stripe を利用します。各社のプライバシーポリシーが適用されます。' },
    { h: '5. Cookie 等', b: 'ログイン状態の維持等のために Cookie を使用します。' },
    { h: '6. 開示・訂正・削除', b: '登録情報の確認・訂正・削除をご希望の場合は、お問い合わせ窓口までご連絡ください。アカウント削除により関連データは削除されます。' },
    { h: '7. 改定', b: '本ポリシーは必要に応じて改定されます。重要な変更はサービス上で告知します。' },
  ]
  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>プライバシーポリシー</h1>
      <p className="mt-3 rounded-xl border px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash-dim)' }}>
        ※ 本ページは雛形です。正式運用の前に内容をご確認・調整ください。
      </p>
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
