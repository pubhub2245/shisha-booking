// 写真アップロード用のストレージ設定（Supabase Storage 公開バケット）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjdxhvggsqxscblmfutw.supabase.co'

export const MIX_PHOTO_BUCKET = 'mix-photos'
export const MIX_PHOTO_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MIX_PHOTO_BUCKET}/`

/** 保存前の検証：自分のストレージの公開URLだけを許可する（任意URL保存を防ぐ） */
export function isValidMixPhotoUrl(url: string): boolean {
  return url.startsWith(MIX_PHOTO_PUBLIC_PREFIX) && url.length <= 500
}
