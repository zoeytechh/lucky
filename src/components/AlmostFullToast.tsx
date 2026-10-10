import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClockIcon } from './icons'

type Props = {
  roundNumber: number
  entryCount: number
  capacity: number
  // Whether the viewer is already an entrant in this round. They don't
  // need a "come join" pitch — they're in — so they get told it's about
  // to start instead, matching the push notification's own split wording
  // (see draw.service.ts's almost-full block).
  youAreIn: boolean
  onClose: () => void
}

const AUTO_DISMISS_MS = 6000

/**
 * The other half of "notifications outside the Draw page" — alongside
 * WinnerToast for a round that just ended, this fires for one that's
 * about to fill up, so someone on another page knows to come grab a
 * slot before it closes. Deliberately not shown on the Draw page itself
 * (see DrawSocketContext) — the ring there already shows the same thing
 * live, so a toast on top of it would just be noise.
 */
export default function AlmostFullToast({ roundNumber, entryCount, capacity, youAreIn, onClose }: Props) {
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
        {youAreIn ? (
          <>
            Round {roundNumber} is filling up —{' '}
            <span className="font-bold text-secondary">
              {entryCount} of {capacity}
            </span>
            . The draw starts soon.
          </>
        ) : (
          <>
            Round {roundNumber} is almost full —{' '}
            <span className="font-bold text-secondary">
              {entryCount} of {capacity}
            </span>
            . Join now!
          </>
        )}
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
