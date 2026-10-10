import { motion } from 'motion/react'
import { useEffect } from 'react'
import { TrophyIcon } from './icons'
import { formatNaira } from '../lib/money'

type Props = {
  displayName: string
  avatarUrl: string | null
  payoutMinor: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 6000

/**
 * The lightweight counterpart to WinnerModal — shown to everyone who
 * *isn't* the winner, on whichever page they're actually on (see
 * DrawSocketContext, which renders this and WinnerModal from the same
 * app-wide announcement instead of only on the Draw page). A full modal
 * for a result that isn't about you would be overkill; this is a glance,
 * not an interruption, so it auto-dismisses instead of needing a tap.
 */
export default function WinnerToast({ displayName, avatarUrl, payoutMinor, onClose }: Props) {
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-ground-raised-2 text-primary">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <TrophyIcon size={18} />
        )}
      </span>
      <span className="flex-1 text-xs leading-snug text-ink">
        <span className="font-bold">{displayName}</span> just won{' '}
        <span className="font-bold text-success">{formatNaira(payoutMinor)}</span>!
      </span>
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
