import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChatIcon } from './Icons'

type Props = {
  displayName: string
  body: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 6000

/**
 * The in-app half of a reply notification — shown wherever the viewer
 * actually is (see CommentSocketContext, mounted app-wide), the external
 * push being the other half for whenever they're not in the app at all
 * (same split every other notification in this app already uses).
 * Links to Draw, the only page the comment feed currently lives on.
 */
export default function CommentReplyToast({ displayName, body, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-x-4 top-20 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ground-raised-2 px-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] sm:inset-x-auto sm:right-4 sm:max-w-xs"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <ChatIcon size={18} />
      </span>
      <Link to="/" onClick={onClose} className="flex-1 text-xs leading-snug text-ink">
        <span className="font-bold">{displayName}</span> replied to your comment:{' '}
        <span className="text-ink-muted">{body}</span>
      </Link>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 text-ink-muted"
      >
        ✕
      </button>
    </motion.div>
  )
}
