'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MIX_PHOTO_BUCKET } from '@/lib/storage'

/**
 * 盛り方の写真をアップロードするコンポーネント。
 * Supabase Storage（公開バケット）へ直接アップロードし、公開URLを hidden input で送信する。
 */
export function PackPhotoInput({ name = 'pack_photo_url', defaultValue = '' }: { name?: string; defaultValue?: string }) {
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
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      // 乱数の代わりに時刻＋ファイルサイズでほぼ一意なパスにする
      const path = `${uid}/${Date.now()}-${file.size}.${ext}`
      const { error: upErr } = await supabase.storage.from(MIX_PHOTO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
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
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="盛り方の写真" className="rounded-xl border object-cover" style={{ width: 120, height: 120, borderColor: 'var(--line-strong)' }} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost text-sm" disabled={busy}>
              {busy ? 'アップロード中…' : '写真を変更'}
            </button>
            <button type="button" onClick={() => setUrl('')} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              削除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-sm"
          style={{ borderColor: 'var(--line-strong)', color: 'var(--color-ash)' }}
        >
          <span className="text-2xl" aria-hidden>📷</span>
          {busy ? 'アップロード中…' : '盛り方の写真を追加'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{error}</p>}
    </div>
  )
}
