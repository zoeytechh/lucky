import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { setPin } from '../lib/pinLock'

/**
 * Mandatory on first launch of the installed app — not skippable, same
 * reasoning as the avatar/name onboarding gate: a real-money app left
 * unlocked on a lost or stolen phone is a real hole, not a hypothetical
 * one, and a PIN that's easy to put off setting up is a PIN that often
 * never gets set up at all.
 */
export default function PinSetup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return
    setStep('confirm')
  }

  async function confirmAndSave() {
    if (confirmPin !== pin) {
      setError("PINs don't match — try again")
      setConfirmPin('')
      return
    }
    setSaving(true)
    await setPin(pin)
    onDone()
  }

  function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (confirmPin.length !== 4 || saving) return
    confirmAndSave()
  }

  // Auto-advance the instant 4 digits land, on both steps — no reason to
  // make someone tap CONTINUE/CONFIRM when the code they just typed is
  // already complete.
  useEffect(() => {
    if (step === 'create' && pin.length === 4) setStep('confirm')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, step])
  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4 && !saving) confirmAndSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, step])

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <span className="font-display text-2xl text-primary">LUCKY YOU</span>

        {step === 'create' ? (
          <form onSubmit={handleCreateSubmit}>
            <p className="mt-2 text-sm text-ink-muted">
              Set a 4-digit PIN to lock the app on this device.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              placeholder="····"
              className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
            >
              CONTINUE
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmSubmit}>
            <p className="mt-2 text-sm text-ink-muted">Enter your PIN again to confirm.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="····"
              className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <AnimatePresence>
              {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            </AnimatePresence>
            <button
              type="submit"
              disabled={confirmPin.length !== 4 || saving}
              className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
            >
              {saving ? 'SAVING…' : 'CONFIRM'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('create')
                setPinValue('')
                setConfirmPin('')
                setError(null)
              }}
              className="mt-3 block w-full text-xs text-ink-muted underline"
            >
              Start over
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
