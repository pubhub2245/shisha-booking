'use client'

import { useEffect } from 'react'
import { incrementView } from '@/actions/social'
import { trackEventOnce } from '@/lib/analytics'

/**
 * マウント時に閲覧数を +1（1ページ表示につき1回）。
 * あわせて Analytics の mix_view を送る。こちらは同一セッション内で mix ごとに1回だけ
 * （戻る/進むでの再マウントで水増ししない）。
 */
export function ViewTracker({ mixId, comboKey }: { mixId: string; comboKey: string | null }) {
  useEffect(() => {
    incrementView(mixId)
    trackEventOnce(`mix_view:${mixId}`, 'mix_view', { mix_id: mixId, combo_key: comboKey ?? '' })
  }, [mixId, comboKey])
  return null
}
