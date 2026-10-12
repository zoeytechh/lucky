import { motion } from 'motion/react'
import { formatNaira } from '../lib/money'
import { useFocusTrap } from '../lib/useFocusTrap'

type Props = {
  entryCostMinor: string
  stakeMinor: string
  feeMinor: string
  armed: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Extracted out of Draw.tsx specifically so useFocusTrap's "runs once on
 * mount, cleans up once on unmount" assumption holds — this component
 * only exists while the dialog is open (Draw.tsx renders it
 * conditionally via AnimatePresence), matching every other modal/toast
 * in the app (WinnerModal, etc.), rather than living inline as part of
 * Draw's own long-lived render where a mount effect would only ever
 * fire once for the whole page instead of once per dialog open.
 */
export default function EntryConfirmDialog({
  entryCostMinor,
  stakeMinor,
  feeMinor,
  armed,
  onCancel,
  onConfirm,
}: Props) {
  const dialogRef = useFocusTrap(onCancel)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm entry"
        className="relative w-full max-w-xs rounded-3xl bg-ground-raised px-6 py-7 text-center shadow-[8px_8px_0_0_rgba(0,0,0,0.35)]"
        initial={{ scale: 0.85, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg uppercase text-ink">Enter this draw?</p>
        <p className="mt-2 text-sm text-ink-muted">
          You'll be charged {formatNaira(entryCostMinor)} — {formatNaira(stakeMinor)} entry fee +{' '}
          {formatNaira(feeMinor)} app charge.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-ground-raised-2 py-2.5 font-display text-sm text-ink"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!armed}
            onClick={() => {
              if (!armed) return
              onConfirm()
            }}
            className="flex-1 rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink disabled:opacity-60"
          >
            YES, ENTER
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
