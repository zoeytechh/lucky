import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiFetch } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { useCommentSocketContext } from '../lib/CommentSocketContext'
import type { Comment } from '../lib/useCommentSocket'
import ErrorAlert from './ErrorAlert'

const MAX_VISIBLE = 100
const MAX_BODY_LENGTH = 280
const COMMENT_TTL_MS = 24 * 60 * 60 * 1000

function dropExpired(comments: Comment[]): Comment[] {
  const cutoff = Date.now() - COMMENT_TTL_MS
  return comments.filter((c) => new Date(c.createdAt).getTime() > cutoff)
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/**
 * Every reply only carries its own direct parent (see useCommentSocket's
 * Comment type) — a reply-to-a-reply doesn't know its thread's original
 * top-level comment on its own. Walks the chain through whatever's
 * currently loaded to find it, so a reply three deep still nests under
 * the same root as a direct reply would (Facebook-style flattened
 * threading, not infinite indent). Falls back to the nearest known
 * ancestor if the chain runs past what's loaded (expired, or outside
 * MAX_VISIBLE) rather than losing the comment entirely.
 */
function findThreadRoot(comment: Comment, byId: Map<string, Comment>): string {
  let current = comment
  const seen = new Set<string>()
  while (current.replyTo && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = byId.get(current.replyTo.id)
    if (!parent) return current.replyTo.id
    current = parent
  }
  return current.id
}

type Thread = { root: Comment; replies: Comment[] }

function buildThreads(comments: Comment[]): Thread[] {
  const byId = new Map(comments.map((c) => [c.id, c]))
  const repliesByRoot = new Map<string, Comment[]>()
  const topLevel: Comment[] = []

  for (const c of comments) {
    if (!c.replyTo) {
      topLevel.push(c)
      continue
    }
    const rootId = findThreadRoot(c, byId)
    const root = byId.get(rootId)
    if (!root) {
      // The root itself isn't loaded (expired/scrolled out) — show this
      // reply as its own top-level entry rather than dropping it.
      topLevel.push(c)
      continue
    }
    if (!repliesByRoot.has(rootId)) repliesByRoot.set(rootId, [])
    repliesByRoot.get(rootId)!.push(c)
  }

  return topLevel.map((root) => ({
    root,
    // comments[] is newest-first; a thread reads naturally oldest-first.
    replies: (repliesByRoot.get(root.id) ?? []).slice().reverse(),
  }))
}

function CommentRow({
  comment,
  isMine,
  onReply,
}: {
  comment: Comment
  isMine: boolean
  onReply: (c: Comment) => void
}) {
  return (
    <div className="rounded-lg bg-ground-raised-2 px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        {/* Own name matches the "Comments" header's own color
            (text-ink-muted), everyone else's stays the usual secondary
            coral — the quick "is this mine?" cue that the earlier
            left/right bubble layout used to carry, kept now that
            threading replaced that layout. */}
        <span className={`text-xs font-medium ${isMine ? 'text-ink-muted' : 'text-secondary'}`}>
          {comment.user.displayName}
        </span>
        <span className="shrink-0 text-[10px] text-ink-muted">{timeAgo(comment.createdAt)}</span>
      </div>
      {comment.replyTo && (
        <p className="mt-0.5 truncate text-[10px] text-ink-muted">
          ↳ Replying to <span className="font-medium">{comment.replyTo.user.displayName}</span>
        </p>
      )}
      <p className="mt-0.5 break-words text-sm text-ink">{comment.body}</p>
      <button
        type="button"
        onClick={() => onReply(comment)}
        className="mt-1 block text-[10px] font-medium text-ink-muted hover:text-secondary"
      >
        Reply
      </button>
    </div>
  )
}

/**
 * Facebook-style threading: top-level comments newest-first (as before),
 * each with its own replies — direct or nested deeper — grouped and
 * indented beneath it, connected by a vertical line, oldest-first within
 * the thread (natural reading order for a conversation). Backfilled once
 * via REST on mount, then kept live over the authenticated /comments
 * socket namespace (see useCommentSocket) — one source of truth for
 * every new comment, including the poster's own.
 */
export default function CommentFeed({
  viewAllHref,
  fullPage = false,
}: {
  /** Shown opposite the "Comments" header, linking to the dedicated
   * comments page — omitted there since you're already on it. */
  viewAllHref?: string
  /** The dedicated comments page itself: no fixed height/scroll
   * container, the list just grows with the page like everywhere else. */
  fullPage?: boolean
}) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const { incoming, expiredIds, post } = useCommentSocketContext()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch(`/api/comments/recent?limit=${MAX_VISIBLE}`)
      .then((res) => setComments(dropExpired(res.comments)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!incoming) return
    setComments((prev) => {
      if (prev.some((c) => c.id === incoming.id)) return prev
      return [incoming, ...prev].slice(0, MAX_VISIBLE)
    })
  }, [incoming])

  useEffect(() => {
    if (!expiredIds || expiredIds.length === 0) return
    setComments((prev) => prev.filter((c) => !expiredIds.includes(c.id)))
  }, [expiredIds])

  // Each comment's own 24h deadline, independent of the server's expiry
  // sweep (which runs every 15 minutes — see jobs/commentExpiry.ts): this
  // keeps what's on screen accurate to the second even in the gap before
  // the server gets around to actually deleting a given row.
  useEffect(() => {
    const interval = setInterval(() => setComments((prev) => dropExpired(prev)), 30_000)
    return () => clearInterval(interval)
  }, [])

  const threads = useMemo(() => buildThreads(comments), [comments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setError(null)
    setPosting(true)
    try {
      const res = await post(body, replyingTo?.id)
      if (res.ok) {
        setDraft('')
        setReplyingTo(null)
      } else {
        setError(new ApiError(res.message, 0, res.code))
      }
    } finally {
      setPosting(false)
    }
  }

  function handleReplyClick(comment: Comment) {
    setReplyingTo(comment)
    inputRef.current?.focus()
  }

  return (
    <div className="mt-8">
      {/* On the dedicated page the page's own "Comments" title already
          says this, and there's no View all link to justify the row. */}
      {!fullPage && (
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">Comments</h2>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-[11px] tracking-wide text-primary">
              View all
            </Link>
          )}
        </div>
      )}

      <div
        ref={listRef}
        className={`card-raised flex flex-col gap-3 rounded-xl bg-ground-raised p-3 ${
          fullPage ? '' : 'mt-3 h-[320px] overflow-y-auto'
        }`}
      >
        {loading ? (
          <p className="py-6 text-center text-xs text-ink-muted">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-muted">
            No comments yet. Be the first to share your experience.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {threads.map(({ root, replies }) => (
              <motion.div
                key={root.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <CommentRow
                  comment={root}
                  isMine={root.user.id === user?.id}
                  onReply={handleReplyClick}
                />
                {replies.length > 0 && (
                  <div className="ml-4 mt-2 flex flex-col gap-2 border-l-2 border-hairline pl-3">
                    {replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        isMine={reply.user.id === user?.id}
                        onReply={handleReplyClick}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <div className="mt-2">
            <ErrorAlert error={error} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center justify-between gap-2 overflow-hidden rounded-lg bg-ground-raised px-3 py-1.5"
          >
            <span className="truncate text-[11px] text-ink-muted">
              Replying to <span className="font-medium text-ink">{replyingTo.user.displayName}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
              className="shrink-0 text-ink-muted"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY_LENGTH))}
          placeholder={replyingTo ? `Reply to ${replyingTo.user.displayName}…` : 'Share your experience…'}
          maxLength={MAX_BODY_LENGTH}
          className="min-w-0 flex-1 rounded-full border border-hairline bg-ground px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <motion.button
          type="submit"
          disabled={posting || !draft.trim()}
          whileTap={{ scale: 0.92 }}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 font-display text-xs text-primary-ink disabled:opacity-50"
        >
          {posting ? '…' : 'Post'}
        </motion.button>
      </form>
    </div>
  )
}
