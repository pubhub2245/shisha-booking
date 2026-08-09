import type { Profile } from '@/lib/types/database'
import { getCurrentUser } from '@/lib/auth'

export type UiMode = 'simple' | 'pro'

/**
 * プロフィールから表示モードを解決する。
 * 明示選択（ui_mode）があればそれ、無ければ認証プロは 'pro'、それ以外は 'simple'。
 */
export function resolveMode(profile: Profile | null | undefined): UiMode {
  if (!profile) return 'simple'
  if (profile.ui_mode === 'simple' || profile.ui_mode === 'pro') return profile.ui_mode
  return profile.is_pro ? 'pro' : 'simple'
}

/** 現在のユーザーの表示モード（未ログインは 'simple'）。 */
export async function getUiMode(): Promise<UiMode> {
  const user = await getCurrentUser()
  return resolveMode(user?.profile)
}

/** モード未選択か（オンボーディングでモード選択を促すため）。 */
export function needsModeChoice(profile: Profile | null | undefined): boolean {
  return !!profile && profile.ui_mode == null
}
