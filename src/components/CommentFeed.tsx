import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ApiError, apiFetch } from '../lib/api'
import { type Comment, useCommentSocket } from '../lib/useCommentSocket'
import ErrorAlert from './ErrorAlert'

const MAX_VISIBLE = 100
const MAX_BODY_LENGTH = 280

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
 * Newest-first, capped at MAX_VISIBLE — a fixed-height scroll container
 * (not an ever-growing page) since this is meant to always show "the
 * most recent 100", not accumulate indefinitely. Backfilled once via
 * REST on mount, then kept live over the authenticated /comments socket
 * namespace (see useCommentSocket) — one source of truth for every new
 * comment, including the poster's own (no optimistic local insert, so
 * there's nothing to reconcile/dedupe against the broadcast).
 */
export default function CommentFeed() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { incoming, post } = useCommentSocket()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch(`/api/comments/recent?limit=${MAX_VISIBLE}`)
      .then((res) => setComments(res.comments))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!incoming) return
    setComments((prev) => {
      if (prev.some((c) => c.id === incoming.id)) return prev
      return [incoming, ...prev].slice(0, MAX_VISIBLE)
    })
  }, [incoming])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setError(null)
    setPosting(true)
    try {
      const res = await post(body)
      if (res.ok) {
        setDraft('')
      } else {
        setError(new ApiError(res.message, 0, res.code))
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">Comments</h2>

      <div
        ref={listRef}
        className="mt-3 flex h-[320px] flex-col gap-2 overflow-y-auto rounded-xl bg-ground-raised p-3"
      >
        {loading ? (
          <p className="py-6 text-center text-xs text-ink-muted">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-muted">
            No comments yet — be the first to share your experience.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="rounded-lg bg-ground-raised-2 px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-secondary">{c.user.displayName}</span>
                  <span className="shrink-0 text-[10px] text-ink-muted">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 break-words text-sm text-ink">{c.body}</p>
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

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY_LENGTH))}
          placeholder="Share your experience…"
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
