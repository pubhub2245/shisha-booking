// 法務ページの事業者情報。値は環境変数から読み、コード側で捏造しない。
// 未設定のときは「その項目が無い」ものとして扱い、開発者向けの警告や
// 環境変数名を一般UIへ出さない（管理者向けの確認は /admin/legal で行う）。

export type LegalInfo = {
  operator: string | null
  manager: string | null
  address: string | null
  phone: string | null
  email: string | null
}

function val(name: string): string | null {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : null
}

export function legalInfo(): LegalInfo {
  return {
    operator: val('LEGAL_OPERATOR'),
    manager: val('LEGAL_MANAGER'),
    address: val('LEGAL_ADDRESS'),
    phone: val('LEGAL_PHONE'),
    email: val('LEGAL_EMAIL'),
  }
}

/** 問い合わせ先メール（未設定なら null）。法務ページの連絡先に使う。 */
export function legalEmail(): string | null {
  return val('LEGAL_EMAIL')
}

/**
 * 有料販売（有料ノート）を提供しているか。
 * Stripe が未設定なら購入導線自体が動かないため、特商法表示の要否判断に使う。
 */
export function paidSalesEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}
