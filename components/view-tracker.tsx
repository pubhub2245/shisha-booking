'use client'

import { useEffect } from 'react'
import { incrementView } from '@/actions/social'

/** マウント時に閲覧数を +1（1ページ表示につき1回） */
export function ViewTracker({ mixId }: { mixId: string }) {
  useEffect(() => {
    incrementView(mixId)
  }, [mixId])
  return null
}
