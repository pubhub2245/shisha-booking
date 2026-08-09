'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { CommentNode } from '@/lib/types/database'
import { Avatar } from '@/components/avatar'
import { CommentForm } from '@/components/comment-form'
import { CommentLikeButton } from '@/components/comment-like-button'
import { relativeTime } from '@/lib/time'
import { deleteComment } from '@/actions/social'

/** 本文中の @ユーザー名 をリンク化する。 */
function renderBody(body: string): ReactNode[] {
  return body.split(/(@[A-Za-z0-9_]{2,30})/g).map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <Link key={i} href={`/u/${part.slice(1)}`} style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          {part}
        </Link>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function authorName(node: CommentNode): string {
  return node.author?.display_name || (node.author?.username ? `@${node.author.username}` : '名無し')
}

function CommentItem({
  node,
  mixId,
  isAuthed,
  currentUserId,
  isReply = false,
}: {
  node: CommentNode
  mixId: string
  isAuthed: boolean
  currentUserId?: string
  isReply?: boolean
}) {
  const [replying, setReplying] = useState(false)
  const name = authorName(node)

  return (
    <div className={isReply ? 'border-l-2 pl-3' : 'card p-4'} style={isReply ? { borderColor: 'var(--line)' } : undefined}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
          <Avatar name={node.author?.display_name || node.author?.username} seed={node.user_id} size={isReply ? 22 : 26} />
          {node.author?.username ? (
            <Link href={`/u/${node.author.username}`} className="hover:underline" style={{ color: 'var(--color-ember-hot)' }}>
              {name}
            </Link>
          ) : (
            <span>{name}</span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>
            {relativeTime(node.created_at)}
          </span>
        </div>
        {currentUserId === node.user_id && (
          <form action={deleteComment}>
            <input type="hidden" name="id" value={node.id} />
            <input type="hidden" name="mix_id" value={mixId} />
            <button type="submit" className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
          </form>
        )}
      </div>

      <p className="mt-1.5 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-cream)' }}>
        {renderBody(node.body)}
      </p>

      <div className="mt-2 flex items-center gap-4">
        <CommentLikeButton commentId={node.id} initialCount={node.like_count} initialLiked={node.my_liked} isAuthed={isAuthed} />
        {!isReply && isAuthed && (
          <button type="button" onClick={() => setReplying((v) => !v)} className="text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}>
            {replying ? 'キャンセル' : '返信'}
          </button>
        )}
      </div>

      {replying && (
        <div className="mt-3">
          <CommentForm
            mixId={mixId}
            isAuthed={isAuthed}
            parentId={node.id}
            compact
            placeholder={`${name} さんに返信…`}
            onDone={() => setReplying(false)}
          />
        </div>
      )}

      {node.replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {node.replies.map((r) => (
            <CommentItem key={r.id} node={r} mixId={mixId} isAuthed={isAuthed} currentUserId={currentUserId} isReply />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentThread({
  comments,
  mixId,
  isAuthed,
  currentUserId,
}: {
  comments: CommentNode[]
  mixId: string
  isAuthed: boolean
  currentUserId?: string
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
        まだコメントはありません。最初のコメントを書きましょう。
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <CommentItem key={c.id} node={c} mixId={mixId} isAuthed={isAuthed} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
