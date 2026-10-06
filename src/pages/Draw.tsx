import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import ErrorAlert from '../components/ErrorAlert'
import Loader from '../components/Loader'
import RoundRing from '../components/RoundRing'
import { ApiError, apiFetch } from '../lib/api'
import { formatNaira } from '../lib/money'
import { useWallet } from '../lib/WalletContext'

type Round = {
  roundId: string | null
  roundNumber: number | null
  entryCount: number
  capacity: number
  entryCostMinor: string
  stakeMinor: string
  winnerPayoutMinor: string
}

type Entry = {
  id: string
  slotNumber: number
  outcome: 'PENDING' | 'WON' | 'REFUNDED' | 'LOST'
  payoutMinor: string | null
  enteredAt: string
}

const outcomeLabel: Record<Entry['outcome'], string> = {
  PENDING: 'Pending',
  WON: 'Won',
  REFUNDED: 'Refunded',
  LOST: 'Lost',
}
const outcomeClass: Record<Entry['outcome'], string> = {
  PENDING: 'text-ink-muted',
  WON: 'text-success',
  REFUNDED: 'text-ink',
  LOST: 'text-danger',
}

export default function Draw() {
  const { refresh: refreshWallet } = useWallet()
  const [round, setRound] = useState<Round | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [roundRes, entriesRes] = await Promise.all([
      apiFetch('/api/draw/current'),
      apiFetch('/api/draw/entries?limit=5'),
    ])
    setRound(roundRes)
    setEntries(entriesRes.entries)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleEnter() {
    setError(null)
    setEntering(true)
    try {
      const idempotencyKey = crypto.randomUUID()
      const result = await apiFetch('/api/draw/entries', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey }),
      })
      setConfirmation(
        result.roundSettled
          ? `You're in — slot ${result.slotNumber}. That was the last slot — the round just settled!`
          : `You're in — slot ${result.slotNumber} of ${round?.capacity}.`,
      )
      await Promise.all([load(), refreshWallet()])
      setTimeout(() => setConfirmation(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Could not enter the draw'))
    } finally {
      setEntering(false)
    }
  }

  if (loading || !round) {
    return (
      <main className="flex justify-center py-16">
        <Loader size="lg" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          {round.roundNumber ? `Round ${round.roundNumber}` : 'Starting soon'}
        </span>

        <RoundRing entered={round.entryCount} capacity={round.capacity} />

        <motion.button
          type="button"
          onClick={handleEnter}
          disabled={entering}
          whileTap={{ scale: 0.95 }}
          className="mt-6 rounded-full bg-primary px-8 py-3 font-display text-base text-primary-ink shadow-[0_8px_22px_-8px_rgba(255,138,126,0.55)] disabled:opacity-60"
        >
          {entering ? 'ENTERING…' : `ENTER — ${formatNaira(round.entryCostMinor)}`}
        </motion.button>

        <AnimatePresence>
          {confirmation && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-xs text-success"
            >
              {confirmation}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <div className="mt-3 w-full">
              <ErrorAlert error={error} action={{ label: 'Go to wallet', to: '/wallet' }} />
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 border-y border-hairline py-4 text-center">
        <div>
          <span className="block font-display text-sm text-success">
            {formatNaira(round.winnerPayoutMinor)}
          </span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Winner</span>
        </div>
        <div>
          <span className="block font-display text-sm text-ink">
            {formatNaira(round.stakeMinor)}
          </span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Refunded</span>
        </div>
        <div>
          <span className="block font-display text-sm text-danger">
            {Math.floor((round.capacity - 1) / 2)}
          </span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Lose it</span>
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
        {round.capacity.toLocaleString()} entries a round. One winner takes half the pool. Half
        of everyone else gets their stake back — the rest fund the winner.
      </p>

      {entries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">
            Your recent entries
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
              >
                <span className="text-sm text-ink">Slot {entry.slotNumber}</span>
                <span className={`font-display text-xs ${outcomeClass[entry.outcome]}`}>
                  {outcomeLabel[entry.outcome]}
                  {entry.payoutMinor && entry.outcome !== 'LOST'
                    ? ` · ${formatNaira(entry.payoutMinor)}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
