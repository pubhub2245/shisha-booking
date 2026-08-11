'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MIX_PHOTO_BUCKET } from '@/lib/storage'
import { Avatar } from '@/components/avatar'

/** アップロード前に正方形へ切り抜き＆縮小・JPEG圧縮する。失敗時は元ファイル。 */
async function squareCompress(file: File, dim = 512, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = dim
    canvas.height = dim
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, dim, dim)
    bitmap.close?.()
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
    return blob ?? file
  } catch {
    return file
  }
}

/**
 * プロフィール画像のアップロード。Supabase Storage（公開バケット）の自分の領域へ上げ、
 * 公開URLを hidden input で送信する。正方形にトリミングして丸く表示。
 */
export function AvatarInput({
  defaultValue = '',
  fallbackName = '?',
  seed,
}: {
  defaultValue?: string
  fallbackName?: string
  seed?: string | null
}) {
  const [url, setUrl] = useState(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選んでください。')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('画像が大きすぎます（8MBまで）。')
      return
    }
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        setError('ログインが必要です。')
        setBusy(false)
        return
      }
      const blob = await squareCompress(file)
      const path = `${uid}/avatar-${Date.now()}-${blob.size}.jpg`
      const { error: upErr } = await supabase.storage.from(MIX_PHOTO_BUCKET).upload(path, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      })
      if (upErr) {
        setError('アップロードに失敗しました。時間をおいて再度お試しください。')
        setBusy(false)
        return
      }
      const { data: pub } = supabase.storage.from(MIX_PHOTO_BUCKET).getPublicUrl(path)
      setUrl(pub.publicUrl)
    } catch {
      setError('アップロードに失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="avatar_url" value={url} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="プロフィール画像" className="rounded-full object-cover" style={{ width: 72, height: 72 }} />
      ) : (
        <Avatar name={fallbackName} seed={seed} size={72} />
      )}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn btn-ghost text-sm">
            {busy ? 'アップロード中…' : url ? '画像を変更' : '画像を選ぶ'}
          </button>
          {url && (
            <button type="button" onClick={() => setUrl('')} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              削除
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>正方形の画像がきれいに表示されます（自動で中央を切り抜き）。</p>
        {error && <p className="text-xs" style={{ color: 'var(--color-ember-hot)' }}>{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
    </div>
  )
}
