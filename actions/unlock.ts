'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 有料ノートの解錠。決済連携（Stripe 等）までは未対応のためスタブ。
 * 決済導入後は、決済完了 Webhook（サービスロール）で mix_unlocks を付与し、
 * このアクションは Checkout セッションの作成にさし替える。
 */
export async function unlockMix(mixId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  // 対象が有料ノートであることだけ確認（決済連携後はここで Checkout を開始する）
  const { data: mix } = await supabase.from('mixes').select('premium').eq('id', mixId).maybeSingle()
  if (!mix || !(mix as { premium?: boolean }).premium) {
    return { error: 'この作り方は有料ノートではありません。' }
  }
  return { error: '決済機能は近日対応予定です。もう少しお待ちください。' }
}
