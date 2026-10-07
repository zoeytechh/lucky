import { motion } from 'motion/react'
import PartyMascot from './PartyMascot'
import { formatNaira } from '../lib/money'

type Props = {
  displayName: string
  avatarUrl: string | null
  slotNumber: number
  payoutMinor: string
  isYou: boolean
  onClose: () => void
}

const RIBBON_COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-success)']

const RIBBONS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: (i * 53) % 100, // spread, deterministic not random — stable across re-renders
  color: RIBBON_COLORS[i % RIBBON_COLORS.length],
  delay: (i % 9) * 0.15,
  duration: 2.6 + ((i * 11) % 7) * 0.2,
  drift: ((i * 29) % 40) - 20,
  width: 5 + (i % 3) * 2,
}))

function FallingRibbons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {RIBBONS.map((r) => (
        <motion.span
          key={r.id}
          className="absolute top-0 rounded-full"
          style={{ left: `${r.left}%`, width: r.width, height: 22, background: r.color }}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: '110vh', x: r.drift, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: r.duration, delay: r.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

/**
 * The "nice animation" the user asked for on top of the inline ring
 * reveal (DrawRoll) — the app's own mascot + falling ribbons in the brand
 * palette, plus the actual winner's name/photo so the whole app sees who
 * won, not just a slot number. Dismissible (backdrop tap or the close
 * button); Draw.tsx also auto-dismisses it after a hold so it never
 * blocks the page if nobody taps anything.
 */
export default function WinnerModal({
  displayName,
  avatarUrl,
  slotNumber,
  payoutMinor,
  isYou,
  onClose,
}: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <FallingRibbons />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Round winner"
        className="relative w-full max-w-xs overflow-hidden rounded-3xl bg-ground-raised px-6 py-8 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
        initial={{ scale: 0.75, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ground-raised-2 text-ink-muted"
        >
          ✕
        </button>

        <div className="flex justify-center">
          <PartyMascot size={56} />
        </div>

        <p className="mt-2 font-display text-sm uppercase tracking-[0.2em] text-primary">
          {isYou ? 'You won!' : 'We have a winner'}
        </p>

        <div className="mx-auto mt-5 h-24 w-24 overflow-hidden rounded-full border-4 border-primary bg-ground-raised-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-primary">
              {displayName.replace(/•/g, '').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className="mt-4 font-display text-xl uppercase text-ink">{displayName}</p>
        <p className="mt-1 text-xs text-ink-muted">Slot {slotNumber}</p>

        <div className="mt-5 rounded-2xl bg-ground px-4 py-3">
          <span className="block font-display text-2xl text-success">{formatNaira(payoutMinor)}</span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-ink-muted">
            Prize won
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink"
        >
          NICE!
        </button>
      </motion.div>
    </motion.div>
  )
}
