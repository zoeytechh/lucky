import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { clearPin, verifyPin } from '../lib/pinLock'
import { useAuth } from '../lib/AuthContext'

export default function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { logout } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return
    setChecking(true)
    setError(null)
    const ok = await verifyPin(pin)
    if (ok) {
      onUnlock()
    } else {
      setError('Incorrect PIN')
      setPin('')
      setChecking(false)
    }
  }

  // Not a password reset — the PIN is purely local, so there's nothing
  // to reset remotely. The only honest recovery is starting the session
  // over: clear the forgotten PIN and fall back to the real login
  // (phone + OTP), which re-proves identity the strong way. App.tsx's own
  // status-based redirect takes it from there once logout() resolves —
  // no explicit navigation needed from here.
  async function handleForgotPin() {
    clearPin()
    await logout()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <span className="font-display text-2xl text-primary">LUCKY YOU</span>
        <form onSubmit={handleSubmit}>
          <p className="mt-2 text-sm text-ink-muted">Enter your PIN to continue.</p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="····"
            className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
          <AnimatePresence>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
          </AnimatePresence>
          <button
            type="submit"
            disabled={pin.length !== 4 || checking}
            className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
          >
            {checking ? 'CHECKING…' : 'UNLOCK'}
          </button>
          <button
            type="button"
            onClick={handleForgotPin}
            className="mt-3 block w-full text-xs text-ink-muted underline"
          >
            Forgot PIN?
          </button>
        </form>
      </div>
    </main>
  )
}
