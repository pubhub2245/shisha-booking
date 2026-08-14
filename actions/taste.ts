'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TASTE_AXES, type TasteAxis } from '@/lib/taste'

type TasteInput = Partial<Record<TasteAxis, number | null>>

/** 1〜5 の整数だけ通す。未入力は null のまま（0 等で補完しない）。 */
function clean(input: TasteInput): Record<string, number | null> {
  const out: Record<string, number | null> = {}
  for (const a of TASTE_AXES) {
    const v = input[a.key]
    out[a.key] = v != null && Number.isFinite(v) && v >= 1 && v <= 5 ? Math.round(v) : null
  }
  return out
}

/**
 * 体験に味覚5軸を保存する（1体験1件。既にあれば更新）。
 * 1軸でも入っていれば保存可。全項目未入力は保存しない（DB側のCHECKとも一致）。
 * 体験の所有者チェックは RLS（experience_id が本人所有か）で担保している。
 */
export async function saveTasteEvaluation(
  experienceId: string,
  input: TasteInput
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const values = clean(input)
  if (Object.values(values).every((v) => v == null)) {
    return { error: '1つ以上の項目を選んでください。' }
  }

  const { error } = await supabase
    .from('taste_evaluations')
    .upsert({ experience_id: experienceId, ...values }, { onConflict: 'experience_id' })
  if (error) return { error: '保存に失敗しました。' }

  revalidatePath('/mypage')
  return { ok: true }
}

/** 自分が付けた味覚評価を削除する（体験そのものは残す）。 */
export async function deleteTasteEvaluation(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = String(formData.get('experience_id') ?? '')
  if (!id) return
  await supabase.from('taste_evaluations').delete().eq('experience_id', id)
  revalidatePath('/mypage')
}
