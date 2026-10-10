import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClockIcon } from './icons'

type Props = {
  roundNumber: number
  onClose: () => void
}

const AUTO_DISMISS_MS = 6000

/**
 * The literal "it's full, drawing right now" moment — distinct from
 * AlmostFullToast's earlier heads-up (one entry before the real 1000-
 * entry round actually fills). Entrant-only: a non-entrant has nothing
 * to watch for here, so this never renders for them. Same reasoning as
 * AlmostFullToast for not showing on the Draw page — the ring there
 * already makes this obvious live.
 */
export default function DrawStartedToast({ roundNumber, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-x-4 top-20 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ground-raised-2 px-4 py-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:right-4 sm:max-w-xs"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <ClockIcon size={18} />
      </span>
      <Link to="/" onClick={onClose} className="flex-1 text-xs leading-snug text-ink">
        Round {roundNumber} is full — the draw has started, winner reveals any moment now!
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
