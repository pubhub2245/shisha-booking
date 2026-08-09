'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** 意見にコメント（議論）を投稿する。 */
export async function addIdeaComment(
  ideaId: number,
  body: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }
  const text = (body ?? '').trim()
  if (!text) return { error: 'コメントを入力してください。' }
  if (text.length > 1000) return { error: 'コメントは1000文字以内で入力してください。' }
  const { error } = await supabase
    .from('idea_comments')
    .insert({ idea_id: ideaId, user_id: user.id, body: text, is_ai: false })
  if (error) return { error: '投稿に失敗しました。時間をおいて再度お試しください。' }
  revalidatePath('/ideas')
  return { ok: true }
}

/** コメントを削除（本人または管理者）。 */
export async function deleteIdeaComment(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = Number(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('idea_comments').delete().eq('id', id)
  revalidatePath('/ideas')
}

const ARBITRATION_MODEL = process.env.ARBITRATION_MODEL || 'claude-haiku-4-5-20251001'

/**
 * 意見が割れているとき、AI が仲裁に入って「落とし所」を提案する。
 * ANTHROPIC_API_KEY が未設定なら何もしない（＝既定では課金は一切発生しない）。
 */
export async function arbitrateIdea(
  ideaId: number
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'ログインが必要です。' }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { error: 'AI仲裁は現在オフです（管理者が ANTHROPIC_API_KEY を設定すると有効になります）。' }
  }

  // 材料を集める
  const [{ data: idea }, { data: votes }, { data: comments }] = await Promise.all([
    supabase.from('ideas').select('title, body').eq('id', ideaId).maybeSingle(),
    supabase.from('idea_votes').select('value, reason').eq('idea_id', ideaId),
    supabase.from('idea_comments').select('body, is_ai').eq('idea_id', ideaId).order('created_at', { ascending: true }).limit(50),
  ])
  if (!idea) return { error: '対象の意見が見つかりません。' }

  const voteRows = (votes ?? []) as { value: number; reason: string | null }[]
  const up = voteRows.filter((v) => v.value === 1).length
  const down = voteRows.filter((v) => v.value === -1).length
  const downReasons = voteRows.filter((v) => v.value === -1 && v.reason).map((v) => v.reason as string)
  // 賛否が両方いるときだけ仲裁する
  if (up < 1 || down < 1) {
    return { error: 'まだ意見が割れていません。賛成・反対の両方が集まると仲裁できます。' }
  }

  const t = idea as { title: string; body: string | null }
  const commentLines = ((comments ?? []) as { body: string; is_ai: boolean }[])
    .filter((c) => !c.is_ai)
    .map((c) => `- ${c.body}`)
    .slice(-30)
    .join('\n')

  const prompt = [
    `あなたはシーシャ（水たばこ）のミックス図鑑アプリ「MixHub」のコミュニティ調整役です。`,
    `アプリの改修要望について、賛成派と反対派で意見が割れています。中立の立場で、双方が納得できる「落とし所」を提案してください。`,
    ``,
    `# 改修要望`,
    `タイトル: ${t.title}`,
    t.body ? `詳細: ${t.body}` : `詳細: （なし）`,
    ``,
    `# 賛成 ${up}人 / 反対 ${down}人`,
    downReasons.length ? `## 反対の理由\n${downReasons.map((r) => `- ${r}`).join('\n')}` : `## 反対の理由\n（記載なし）`,
    commentLines ? `\n# これまでの議論\n${commentLines}` : '',
    ``,
    `# 出力の指示`,
    `- 200〜300字程度の日本語で、結論（落とし所）を先に述べる。`,
    `- 賛成・反対どちらかに肩入れせず、両方の懸念に触れる。`,
    `- 「まず〜だけ試す」「〜の条件付きで導入」など、段階的・条件付きの具体案を1つ示す。`,
    `- 前置き（「承知しました」等）や見出しは書かず、本文だけを返す。`,
  ].join('\n')

  let summary = ''
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ARBITRATION_MODEL,
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      return { error: `AI仲裁に失敗しました（${res.status}）。時間をおいて再度お試しください。` }
    }
    const json = (await res.json()) as { content?: { type: string; text?: string }[] }
    summary = (json.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim()
  } catch {
    return { error: 'AI仲裁の呼び出しに失敗しました。時間をおいて再度お試しください。' }
  }

  if (!summary) return { error: 'AIの応答が空でした。時間をおいて再度お試しください。' }

  const { error: saveErr } = await supabase.rpc('save_arbitration', { p_idea_id: ideaId, p_summary: summary })
  if (saveErr) return { error: '仲裁案の保存に失敗しました。' }

  revalidatePath('/ideas')
  return { ok: true }
}
