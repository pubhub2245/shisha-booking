import { track } from '@vercel/analytics/server'
import { headers } from 'next/headers'

/**
 * サーバーアクションから送るカスタムイベント。
 * 成功時に redirect() するアクション（投稿・signup）はクライアントで成功を観測できないため、
 * サーバー側から送る。
 *
 * ■ PII を送らないこと
 * email / username / display_name / 本文などは渡さない。区分と件数だけ。
 */
export type EndoServerEvent =
  /** mixes の INSERT 成功。mode は投稿フォームの種類、flavor_count はフレーバー数 */
  | ['method_posted', { mode: 'simple' | 'detailed'; flavor_count: number }]
  /** signup 成功。個人情報は一切載せない */
  | ['signup', Record<string, never>]

export async function trackServerEvent(...event: EndoServerEvent): Promise<void> {
  const [name, props] = event
  try {
    await track(name, props, { headers: await headers() })
  } catch {
    // 計測は best-effort。ローカル開発や計測未設定でも本処理を止めない。
  }
}
