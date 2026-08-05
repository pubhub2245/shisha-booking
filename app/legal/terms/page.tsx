export const metadata = { title: '利用規約 — MixHub' }

export default function TermsPage() {
  const sections: { h: string; b: string }[] = [
    { h: '第1条（適用）', b: '本規約は、MixHub（以下「本サービス」）の利用に関する条件を、利用者と運営者との間で定めるものです。' },
    { h: '第2条（アカウント）', b: '利用者は正確な情報で登録し、アカウントを自己の責任で管理するものとします。不正利用による損害の責任は利用者が負います。' },
    { h: '第3条（投稿内容）', b: '投稿されたミックスやコメント等の権利は投稿者に帰属します。投稿者は、本サービス上での表示・複製に必要な範囲の利用を運営者に許諾するものとします。第三者の権利を侵害する投稿は禁止します。' },
    { h: '第4条（有料コンテンツ）', b: '一部の投稿は有料ノートとして販売されます。購入により、購入者は当該コンテンツを閲覧できます。デジタルコンテンツの性質上、原則として返金はできません（特定商取引法に基づく表記をご確認ください）。' },
    { h: '第5条（禁止事項）', b: '法令・公序良俗に反する行為、他者への迷惑行為、なりすまし、虚偽情報の投稿、システムへの不正アクセス等を禁止します。喫煙・シーシャに関する情報は各地域の法令・年齢制限に従ってご利用ください。' },
    { h: '第6条（免責）', b: '本サービスの情報の正確性・有用性について運営者は保証しません。作り方等の実践は利用者自身の責任で行うものとします。' },
    { h: '第7条（サービスの変更・停止）', b: '運営者は、利用者への事前告知なく本サービスの内容を変更・停止できるものとします。' },
    { h: '第8条（規約の変更）', b: '本規約は必要に応じて変更されます。変更後の規約は本サービス上に掲示した時点で効力を生じます。' },
  ]
  return (
    <div className="wrap max-w-2xl py-10">
      <h1 className="text-2xl" style={{ fontWeight: 800 }}>利用規約</h1>
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
