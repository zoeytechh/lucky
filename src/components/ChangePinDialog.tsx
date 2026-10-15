import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { setPin, verifyPin } from '../lib/pinLock'
import { useFocusTrap } from '../lib/useFocusTrap'

type Step = 'old' | 'new' | 'confirm'

/**
 * Only reachable from Profile when a PIN is already set on this device —
 * requires the current PIN before allowing a new one, same reasoning a
 * password-change flow requires the current password: whoever's holding
 * the device and already past the lock screen could otherwise just set a
 * new PIN unchallenged, defeating the lock's whole purpose for the actual
 * owner coming back later.
 */
export default function ChangePinDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useFocusTrap(onClose)
  const [step, setStep] = useState<Step>('old')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function verifyOld() {
    setBusy(true)
    setError(null)
    const ok = await verifyPin(oldPin)
    setBusy(false)
    if (!ok) {
      setError('Incorrect PIN')
      setOldPin('')
      return
    }
    setStep('new')
  }

  function handleOldSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (oldPin.length !== 4 || busy) return
    verifyOld()
  }

  function handleNewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPin.length !== 4) return
    setError(null)
    setStep('confirm')
  }

  async function confirmAndSave() {
    if (confirmPin !== newPin) {
      setError("PINs don't match — try again")
      setConfirmPin('')
      return
    }
    setBusy(true)
    await setPin(newPin)
    onClose()
  }

  function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (confirmPin.length !== 4 || busy) return
    confirmAndSave()
  }

  // Auto-advance the instant 4 digits land, on every step — no reason to
  // make someone tap NEXT/SAVE when the code they just typed is already
  // complete.
  useEffect(() => {
    if (step === 'old' && oldPin.length === 4 && !busy) verifyOld()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldPin, step])
  useEffect(() => {
    if (step === 'new' && newPin.length === 4) {
      setError(null)
      setStep('confirm')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPin, step])
  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4 && !busy) confirmAndSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, step])

  const inputClass =
    'mt-5 w-full rounded-lg border border-hairline bg-ground-raised-2 px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 px-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Change PIN"
        className="relative w-full max-w-xs rounded-3xl bg-ground-raised px-6 py-7 text-center shadow-[8px_8px_0_0_rgba(0,0,0,0.35)]"
        initial={{ scale: 0.85, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'old' && (
          <form onSubmit={handleOldSubmit}>
            <p className="font-display text-lg uppercase text-ink">Change PIN</p>
            <p className="mt-2 text-sm text-ink-muted">Enter your current PIN.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              placeholder="····"
              className={inputClass}
            />
            <AnimatePresence>
              {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            </AnimatePresence>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-ground-raised-2 py-2.5 font-display text-sm text-ink"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={oldPin.length !== 4 || busy}
                className="flex-1 rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink disabled:opacity-60"
              >
                {busy ? '…' : 'NEXT'}
              </button>
            </div>
          </form>
        )}

        {step === 'new' && (
          <form onSubmit={handleNewSubmit}>
            <p className="font-display text-lg uppercase text-ink">Change PIN</p>
            <p className="mt-2 text-sm text-ink-muted">Enter a new 4-digit PIN.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="····"
              className={inputClass}
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-ground-raised-2 py-2.5 font-display text-sm text-ink"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={newPin.length !== 4}
                className="flex-1 rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink disabled:opacity-60"
              >
                NEXT
              </button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleConfirmSubmit}>
            <p className="font-display text-lg uppercase text-ink">Change PIN</p>
            <p className="mt-2 text-sm text-ink-muted">Enter your new PIN again to confirm.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="····"
              className={inputClass}
            />
            <AnimatePresence>
              {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            </AnimatePresence>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-ground-raised-2 py-2.5 font-display text-sm text-ink"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={confirmPin.length !== 4 || busy}
                className="flex-1 rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink disabled:opacity-60"
              >
                {busy ? 'SAVING…' : 'SAVE'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
