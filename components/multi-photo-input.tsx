'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MIX_PHOTO_BUCKET } from '@/lib/storage'

async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap
    const longest = Math.max(width, height)
    if (longest > maxDim) {
      const s = maxDim / longest
      width = Math.round(width * s)
      height = Math.round(height * s)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/** ミックスの追加写真（工程写真など）を複数アップロード。URLを hidden input で送信。 */
export function MultiPhotoInput({
  name = 'mix_photo_url',
  defaultValue = [],
  max = 8,
}: {
  name?: string
  defaultValue?: string[]
  max?: number
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError('')
    const room = max - urls.length
    if (room <= 0) {
      setError(`写真は最大${max}枚までです。`)
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
      const added: string[] = []
      const targets = files.slice(0, room)
      for (let i = 0; i < targets.length; i++) {
        const file = targets[i]
        if (!file.type.startsWith('image/')) continue
        if (file.size > 8 * 1024 * 1024) continue
        const blob = await compressImage(file)
        const isJpeg = blob !== file
        const ext = isJpeg ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
        const path = `${uid}/${Date.now()}-${file.size}-${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(MIX_PHOTO_BUCKET)
          .upload(path, blob, { cacheControl: '3600', upsert: true, contentType: isJpeg ? 'image/jpeg' : file.type })
        if (!upErr) {
          const { data: pub } = supabase.storage.from(MIX_PHOTO_BUCKET).getPublicUrl(path)
          added.push(pub.publicUrl)
        }
      }
      if (added.length > 0) setUrls((u) => [...u, ...added])
      else setError('アップロードに失敗しました。')
    } catch {
      setError('アップロードに失敗しました。')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      {urls.map((u) => (
        <input key={u} type="hidden" name={name} value={u} />
      ))}
      <div className="flex flex-wrap gap-2">
        {urls.map((u) => (
          <div key={u} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="追加写真" className="rounded-lg border object-cover" style={{ width: 84, height: 84, borderColor: 'var(--line-strong)' }} />
            <button
              type="button"
              onClick={() => setUrls((arr) => arr.filter((x) => x !== u))}
              aria-label="この写真を削除"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
              style={{ background: 'var(--color-ember-deep)' }}
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed text-xs"
            style={{ width: 84, height: 84, borderColor: 'var(--line-strong)', color: 'var(--color-ash)' }}
          >
            <span className="text-xl" aria-hidden>＋</span>
            {busy ? '中…' : '追加'}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-ember-hot)' }}>{error}</p>}
    </div>
  )
}
