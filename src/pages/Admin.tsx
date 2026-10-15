import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import Skeleton from '../components/Skeleton'
import { apiFetch } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { formatNaira } from '../lib/money'

type Send = {
  id: string
  amountMinor: string
  recipient: string
  note: string | null
  createdAt: string
}

/**
 * Admin-only: the SYSTEM wallet's balance (where every ₦200 entry fee
 * lands, see draw.service.ts) and a way to manually pay out of it —
 * built for the daily leaderboard prize, which has no automated job yet
 * (see progress.md), but usable for any other one-off payout too.
 * role==='ADMIN' is set by hand in the database; there's no self-service
 * way to become one, so this just redirects anyone else away rather than
 * showing a dead end.
 */
export default function Admin() {
  const { user } = useAuth()
  const [balanceMinor, setBalanceMinor] = useState<string | null>(null)
  const [sends, setSends] = useState<Send[] | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Separate from `error` above (the send-payout action's own error) — a
  // failed page load used to leave balanceMinor/sends stuck at null
  // forever, skeletons showing with no error and no way to recover short
  // of a manual reload.
  const [loadError, setLoadError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      const [wallet, sendsRes] = await Promise.all([
        apiFetch('/api/admin/wallet'),
        apiFetch('/api/admin/sends'),
      ])
      setBalanceMinor(wallet.balanceMinor)
      setSends(sendsRes.sends)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error('Could not load admin data'))
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [user, load])

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const naira = Number(amount)
    if (!phoneNumber || !naira || naira <= 0) {
      setError(new Error('Enter a phone number and a positive amount'))
      return
    }
    setBusy(true)
    try {
      await apiFetch('/api/admin/send', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          amountMinor: Math.round(naira * 100),
          note: note || undefined,
        }),
      })
      setSuccess(`Sent ${formatNaira(Math.round(naira * 100))} to ${phoneNumber}.`)
      setPhoneNumber('')
      setAmount('')
      setNote('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Send failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Admin</h1>

      {loadError && balanceMinor === null && (
        <div className="mt-4">
          <ErrorAlert error={loadError} onRetry={load} />
        </div>
      )}

      <div className="card-raised mt-5 rounded-xl bg-ground-raised px-5 py-6 text-center">
        <span className="block text-[11px] tracking-wider text-ink-muted">
          SYSTEM WALLET BALANCE
        </span>
        {balanceMinor === null ? (
          <Skeleton className="mx-auto mt-2 h-8 w-32" />
        ) : (
          <span className="mt-1 block font-display text-3xl tabular-nums text-primary">
            {formatNaira(balanceMinor)}
          </span>
        )}
      </div>

      <h2 className="mt-8 text-[11px] uppercase tracking-wider text-ink-muted">
        Send a payout
      </h2>
      <form onSubmit={handleSend} className="mt-3 flex flex-col gap-3">
        <input
          type="tel"
          placeholder="Recipient phone (080X XXX XXXX)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Amount (₦)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          placeholder="Note (optional — e.g. 'Top leaderboard, Oct 10')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />

        {error && <ErrorAlert error={error} />}
        {success && (
          <p className="rounded-lg bg-success/15 px-4 py-2.5 text-xs text-success">{success}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
        >
          {busy ? 'SENDING…' : 'SEND'}
        </button>
      </form>

      <h2 className="mt-8 text-[11px] uppercase tracking-wider text-ink-muted">
        Recent sends
      </h2>
      {sends === null ? (
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
            >
              <div className="flex flex-col items-start gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      ) : sends.length === 0 ? (
        <p className="mt-3 rounded-xl border border-hairline py-10 text-center text-xs text-ink-muted">
          No payouts sent yet.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {sends.map((s) => (
            <div
              key={s.id}
              className="card-raised-sm flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
            >
              <div>
                <span className="block text-sm text-ink">{s.recipient}</span>
                <span className="block text-[10px] text-ink-muted">
                  {s.note ?? '—'} ·{' '}
                  {new Date(s.createdAt).toLocaleString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="font-display text-sm tabular-nums text-ink">
                {formatNaira(s.amountMinor)}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
