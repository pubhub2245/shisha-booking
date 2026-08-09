import Link from 'next/link'
import type { Metadata } from 'next'
import { getIdeas } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { IdeaForm } from '@/components/idea-form'
import { IdeaVoteButtons } from '@/components/idea-vote-buttons'
import { IdeaComments } from '@/components/idea-comments'
import { deleteIdea, setIdeaStatus } from '@/actions/ideas'
import { relativeTime } from '@/lib/time'
import { Avatar } from '@/components/avatar'
import { IDEA_CATEGORIES, ideaCategory } from '@/lib/ideas'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '意見箱 — MixHub',
  description: 'アプリの改修要望を投稿して、みんなの👍👎で優先度を決めます。要望が多いものから改善します。',
}

const STATUS: Record<string, { l: string; color: string; bg: string }> = {
  open: { l: '募集中', color: 'var(--color-ember-hot)', bg: 'var(--accent-tint)' },
  considering: { l: '検討中', color: '#b7791f', bg: 'rgb(213 153 43 / 0.12)' },
  done: { l: '対応済み', color: '#2ba088', bg: 'rgb(31 138 118 / 0.12)' },
  declined: { l: '見送り', color: 'var(--color-ash-dim)', bg: 'var(--line)' },
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string; status?: string }>
}) {
  const sp = await searchParams
  const [allIdeas, user] = await Promise.all([getIdeas(), getCurrentUser()])
  const isAdmin = !!user?.profile?.is_admin

  const cat = IDEA_CATEGORIES.some((c) => c.v === sp.cat) ? sp.cat : ''
  const sort = sp.sort === 'new' ? 'new' : 'popular'
  const activeOnly = sp.status === 'active'

  let ideas = allIdeas
  if (cat) ideas = ideas.filter((i) => i.category === cat)
  if (activeOnly) ideas = ideas.filter((i) => i.status === 'open' || i.status === 'considering')
  if (sort === 'new') ideas = [...ideas].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  // フィルタURL構築
  const href = (o: { cat?: string; sort?: string; active?: boolean }) => {
    const p = new URLSearchParams()
    const c = 'cat' in o ? o.cat : cat
    const s = o.sort ?? sort
    const a = 'active' in o ? o.active : activeOnly
    if (c) p.set('cat', c)
    if (s === 'new') p.set('sort', 'new')
    if (a) p.set('status', 'active')
    const str = p.toString()
    return str ? `/ideas?${str}` : '/ideas'
  }

  return (
    <div className="wrap max-w-2xl py-10">
      <p className="eyebrow">Feedback</p>
      <h1 className="mt-2 text-3xl" style={{ fontWeight: 800 }}>意見箱</h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
        「こう直してほしい」を投稿して、みんなの <b>👍</b> で優先度を決める場所です。
        なんでも採用するとアプリが散らかるので、<b>要望が多い（👍が多い）ものから改善</b>していきます。反対は理由付きの 👎 で示せます。
        賛否が割れたときは <b>コメントで議論</b>したり、<b>🤝 AIに中立の落とし所を提案</b>してもらえます。
      </p>

      <div className="mt-6">
        <IdeaForm isAuthed={!!user} />
      </div>

      {/* 並び替え・絞り込み */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href({ sort: 'popular' })} className={`chip ${sort === 'popular' ? 'chip-active' : ''}`}>👍 人気</Link>
          <Link href={href({ sort: 'new' })} className={`chip ${sort === 'new' ? 'chip-active' : ''}`}>新着</Link>
          <Link href={href({ active: !activeOnly })} className={`chip ${activeOnly ? 'chip-active' : ''}`}>未対応のみ</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ cat: '' })} className={`chip ${!cat ? 'chip-active' : ''}`}>すべて</Link>
          {IDEA_CATEGORIES.map((c) => (
            <Link key={c.v} href={href({ cat: c.v })} className={`chip ${cat === c.v ? 'chip-active' : ''}`}>{c.icon} {c.l}</Link>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {ideas.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--color-ash)' }}>
            {cat || activeOnly ? '条件に合う意見がありません。' : 'まだ意見がありません。最初の要望を投稿しましょう。'}
          </div>
        ) : (
          ideas.map((idea) => {
            const st = STATUS[idea.status] ?? STATUS.open
            const canDelete = isAdmin || (user && idea.user_id === user.id)
            return (
              <div key={idea.id} className="card flex gap-3 p-4">
                <IdeaVoteButtons ideaId={idea.id} up={idea.up} down={idea.down} myVote={idea.myVote} isAuthed={!!user} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.68rem]"
                      style={{ background: st.bg, color: st.color, fontWeight: 700 }}
                    >
                      {st.l}
                    </span>
                    <span className="text-[0.68rem]" style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}>
                      {ideaCategory(idea.category).icon} {ideaCategory(idea.category).l}
                    </span>
                    <h2 className="text-base leading-snug" style={{ fontWeight: 700 }}>{idea.title}</h2>
                  </div>
                  {idea.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-ash)' }}>{idea.body}</p>
                  )}
                  {idea.downReasons.length > 0 && (
                    <details className="mt-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--line)' }}>
                      <summary className="cursor-pointer text-xs" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>
                        🚫 反対の理由（{idea.downReasons.length}）
                      </summary>
                      <ul className="mt-2 flex flex-col gap-1">
                        {idea.downReasons.map((r, i) => (
                          <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                            ・{r}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    <Avatar name={idea.author?.display_name || idea.author?.username || '?'} seed={idea.user_id || String(idea.id)} size={18} />
                    {idea.author?.username ? (
                      <Link href={`/u/${idea.author.username}`} className="hover:underline">
                        {idea.author.display_name || `@${idea.author.username}`}
                      </Link>
                    ) : (
                      <span>{idea.author?.display_name || '匿名'}</span>
                    )}
                    <span>・ {relativeTime(idea.created_at)}</span>
                  </div>

                  <IdeaComments
                    ideaId={idea.id}
                    comments={idea.comments}
                    arbitration={idea.arbitration}
                    up={idea.up}
                    down={idea.down}
                    isAuthed={!!user}
                    isAdmin={isAdmin}
                    currentUserId={user?.id ?? null}
                  />

                  {(isAdmin || canDelete) && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                      {isAdmin && (
                        <form action={setIdeaStatus} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={idea.id} />
                          <select name="status" defaultValue={idea.status} className="rounded-lg border px-2 py-1 text-xs" style={{ background: 'var(--color-smoke-850)', borderColor: 'var(--line-strong)', color: 'var(--color-cream)' }}>
                            <option value="open">募集中</option>
                            <option value="considering">検討中</option>
                            <option value="done">対応済み</option>
                            <option value="declined">見送り</option>
                          </select>
                          <button type="submit" className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>更新</button>
                        </form>
                      )}
                      {canDelete && (
                        <form action={deleteIdea}>
                          <input type="hidden" name="id" value={idea.id} />
                          <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
