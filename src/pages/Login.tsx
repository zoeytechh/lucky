import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

// Mirrors the backend's own per-phone cooldown (otp.service.ts,
// REQUEST_COOLDOWN_MS) — purely cosmetic (the server is the real guard),
// just gives the resend button something sensible to count down from
// instead of either hiding it entirely or letting the user hit the
// 429 blind.
const RESEND_COOLDOWN_S = 60

export default function Login() {
  const { status, user, requestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendIn])

  // Guard clauses come after every hook call — React requires hooks to run
  // unconditionally in the same order on every render, so an early return
  // above them caused "rendered fewer hooks than expected" on navigation.
  if (status === 'authenticated' && (user?.role !== 'USER' || user.avatarUrl)) {
    return <Navigate to="/" replace />
  }
  if (status === 'authenticated' && user?.role === 'USER' && !user.avatarUrl) {
    return <Navigate to="/onboarding" replace />
  }

  // Shared by both handlers below: on OTP_RATE_LIMIT, the server tells us
  // exactly how long is left (otp.service.ts's retryAfterSeconds) — sync
  // the countdown to that instead of leaving it unset, which is what let
  // a 429 appear on the phone step with no countdown at all (that
  // button never starts one on its own, only a successful send does).
  function applyError(err: unknown) {
    if (err instanceof ApiError && err.code === 'OTP_RATE_LIMIT' && typeof err.retryAfterSeconds === 'number') {
      setResendIn(err.retryAfterSeconds)
    }
    setError(err instanceof Error ? err : new Error('Something went wrong'))
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await requestOtp(phoneNumber)
      setStep('code')
      setResendIn(RESEND_COOLDOWN_S)
    } catch (err) {
      applyError(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setError(null)
    setBusy(true)
    try {
      await requestOtp(phoneNumber)
      setCode('')
      setResendIn(RESEND_COOLDOWN_S)
    } catch (err) {
      applyError(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyOtp(phoneNumber, code)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Incorrect code'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <span className="font-display text-2xl text-primary">LUCKY</span>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <p className="mt-2 text-sm text-ink-muted">
              Enter your phone number to get a code.
            </p>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="080X XXX XXXX"
              className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <AnimatePresence>
              {error && (
                <div className="mt-3">
                  <ErrorAlert error={error} />
                </div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={busy || resendIn > 0}
              className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
            >
              {busy ? 'SENDING…' : resendIn > 0 ? `WAIT ${resendIn}s` : 'SEND CODE'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="mt-2 text-sm text-ink-muted">
              Enter the 6-digit code sent to {phoneNumber}.
            </p>
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center tracking-[0.3em] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <AnimatePresence>
              {error && (
                <div className="mt-3">
                  <ErrorAlert error={error} />
                </div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
            >
              {busy ? 'VERIFYING…' : 'VERIFY'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={busy || resendIn > 0}
              className="mt-3 block w-full text-xs text-ink-muted underline disabled:no-underline disabled:opacity-60"
            >
              {busy ? 'Sending…' : resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
                setResendIn(0)
              }}
              className="mt-2 block w-full text-xs text-ink-muted underline"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
