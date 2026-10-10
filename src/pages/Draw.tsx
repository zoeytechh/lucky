import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CommentFeed from '../components/CommentFeed'
import DrawRoll from '../components/DrawRoll'
import ErrorAlert from '../components/ErrorAlert'
import { CheckCircleIcon, ChevronRightIcon, QuestionIcon, TrophyIcon } from '../components/icons'
import Loader from '../components/Loader'
import { ApiError, apiFetch } from '../lib/api'
import { useDrawSocketContext } from '../lib/DrawSocketContext'
import { formatRoundDate } from '../lib/date'
import { formatNaira } from '../lib/money'
import { useWallet } from '../lib/WalletContext'

type Round = {
  roundId: string | null
  roundNumber: number | null
  entryCount: number
  capacity: number
  entryCostMinor: string
  stakeMinor: string
  feeMinor: string
  winnerPayoutMinor: string
  // When this round starts accepting entries — in the future for as long
  // as the *previous* round's reveal is still playing out (see the
  // schema comment on DrawRound.entriesOpenAt in lucky-api). Backend-
  // enforced, not just a frontend gate.
  entriesOpenAt: string | null
}

type MyEntry = {
  id: string
  roundId: string
  slotNumber: number
  outcome: 'PENDING' | 'WON' | 'REFUNDED' | 'LOST'
}

type RecentEntry = {
  id: string
  roundNumber: number
  roundDate: string
  slotNumber: number
  outcome: 'PENDING' | 'WON' | 'REFUNDED' | 'LOST'
  user: { id: string; displayName: string }
}

type PlaceEntryResponse = {
  entryId: string
  slotNumber: number
  roundId: string
  roundNumber: number
  roundSettled: boolean
  winnerSlotNumber?: number
  winnerDisplayName?: string
  winnerAvatarUrl?: string | null
  winnerPayoutMinor?: string
  revealAt?: string
  nextRoundId?: string
  nextRoundNumber?: number
  nextEntriesOpenAt?: string
}

const outcomeLabel: Record<RecentEntry['outcome'], string> = {
  PENDING: 'Pending',
  WON: 'Won',
  REFUNDED: 'Refunded',
  LOST: 'Lost',
}
const outcomeClass: Record<RecentEntry['outcome'], string> = {
  PENDING: 'text-ink-muted',
  WON: 'text-success',
  REFUNDED: 'text-ink',
  LOST: 'text-danger',
}

export default function Draw() {
  const { refresh: refreshWallet } = useWallet()
  const [round, setRound] = useState<Round | null>(null)
  const [myEntries, setMyEntries] = useState<MyEntry[]>([])
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  // Gates the actual entry behind an explicit yes/no — a real-money
  // charge shouldn't fire off a single accidental tap. See the
  // confirm-entry dialog JSX below; handleEnter only ever runs once this
  // has been answered "yes".
  const [confirmingEntry, setConfirmingEntry] = useState(false)
  // The dialog's own buttons ignore taps for a brief moment after it
  // opens — on a touch device, if the dialog renders exactly under a
  // finger still touching the screen from the tap that opened it, the
  // release can land on "Yes, Enter" underneath and fire immediately,
  // skipping the confirmation entirely. This closes that gap.
  const [dialogArmed, setDialogArmed] = useState(false)
  useEffect(() => {
    if (!confirmingEntry) {
      setDialogArmed(false)
      return
    }
    const timer = setTimeout(() => setDialogArmed(true), 350)
    return () => clearTimeout(timer)
  }, [confirmingEntry])
  // The suspense/reveal sequence itself — and the winner announcement it
  // feeds — now lives in DrawSocketContext, mounted once in App.tsx above
  // the routed Outlet, specifically so it survives navigating away from
  // this page and still fires wherever the viewer actually is. This page
  // just reads the ring-driving pieces it needs from there.
  const { progress, pendingSettlement, revealWinnerSlot, enqueueSettlement } = useDrawSocketContext()

  const load = useCallback(async () => {
    const [roundRes, myEntriesRes, recentRes] = await Promise.all([
      apiFetch('/api/draw/current'),
      apiFetch('/api/draw/entries?limit=5'),
      apiFetch('/api/draw/recent-entries?pageSize=3'),
    ])
    setRound(roundRes)
    setMyEntries(myEntriesRes.entries)
    setRecentEntries(recentRes.entries)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  // Live progress — every connected viewer's ring fills in step with
  // every entry, not just their own, since this only reflects whichever
  // round the server says is currently open. Depends only on `progress`
  // (one run per socket event) — depending on `round` too, as this once
  // did, is a classic infinite-loop trap: the effect would call setRound,
  // which changes `round`'s identity even when entryCount is unchanged,
  // which re-triggers the effect, forever. The round/entryCount check now
  // lives inside the updater against the latest state, and bails out
  // returning the *same* object when there's nothing to change, so a
  // no-op update never forces a re-render in the first place.
  useEffect(() => {
    if (!progress) return
    setRound((r) => {
      if (!r || progress.roundId !== r.roundId || r.entryCount === progress.entryCount) return r
      return { ...r, entryCount: progress.entryCount }
    })
  }, [progress])

  // Re-fetches this page's own round/entries state once a reveal this
  // page was watching concludes (pendingSettlement going from set to
  // null) — the shared context no longer does this itself since it has
  // no reason to know about this page's own display data; it only
  // refreshes the wallet (see DrawSocketContext), which matters
  // regardless of the current page.
  const prevPendingSettlementRef = useRef(pendingSettlement)
  useEffect(() => {
    if (prevPendingSettlementRef.current && !pendingSettlement) load()
    prevPendingSettlementRef.current = pendingSettlement
  }, [pendingSettlement, load])

  async function handleEnter() {
    setError(null)
    setEntering(true)
    try {
      const idempotencyKey = crypto.randomUUID()
      const result: PlaceEntryResponse = await apiFetch('/api/draw/entries', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey }),
      })

      // Reflected locally right away — important for the settled branch
      // below, which deliberately skips load() until after the reveal,
      // so the ring and the "you're in" button state shouldn't have to
      // wait on a refetch to catch up.
      setRound((r) => (r ? { ...r, entryCount: result.slotNumber } : r))
      setMyEntries((prev) => [
        { id: result.entryId, roundId: result.roundId, slotNumber: result.slotNumber, outcome: 'PENDING' },
        ...prev,
      ])

      setConfirmation(
        result.roundSettled
          ? `You're in at slot ${result.slotNumber}. That was the last slot, the draw is starting!`
          : `You're in at slot ${result.slotNumber} of ${round?.capacity}.`,
      )
      setTimeout(() => setConfirmation(null), 4000)

      if (result.roundSettled) {
        // Drive the reveal from this response's own settlement info
        // directly, instead of waiting on the socket broadcast for it —
        // that broadcast can race this very request's own socket
        // handshake if the page only just connected, which is exactly
        // what left the entrant who completed the round seeing no
        // reveal and a stale wallet balance. load()/refreshWallet() for
        // this round happen later, after the reveal (see the
        // revealWinnerSlot effect above). Enqueued, not set directly —
        // same dedup/queueing as the socket path, in case both arrive.
        enqueueSettlement({
          roundId: result.roundId,
          roundNumber: result.roundNumber,
          winnerSlotNumber: result.winnerSlotNumber!,
          winnerDisplayName: result.winnerDisplayName!,
          winnerAvatarUrl: result.winnerAvatarUrl ?? null,
          winnerPayoutMinor: result.winnerPayoutMinor!,
          revealAt: result.revealAt!,
          nextRoundId: result.nextRoundId!,
          nextRoundNumber: result.nextRoundNumber!,
          nextEntriesOpenAt: result.nextEntriesOpenAt!,
        })
      } else {
        await Promise.all([load(), refreshWallet()])
      }
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

  const myCurrentEntry = myEntries.find((e) => e.roundId === round.roundId)

  // True for the whole suspense-through-hold window, whether this viewer
  // has been watching since the round filled (pendingSettlement comes
  // from the live socket broadcast) or just joined mid-reveal (same
  // state, but populated by load()'s `drawing` catch-up instead) — in
  // both cases entries are genuinely refused server-side until
  // nextEntriesOpenAt, so the button being disabled here is enforcement
  // the backend actually holds, not just a UI nicety.
  const drawInProgress =
    !!pendingSettlement || (round.entriesOpenAt ? new Date(round.entriesOpenAt) > new Date() : false)

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <AnimatePresence>
        {confirmingEntry && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ground/80 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmingEntry(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm entry"
              className="relative w-full max-w-xs rounded-3xl bg-ground-raised px-6 py-7 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-display text-lg uppercase text-ink">Enter this draw?</p>
              <p className="mt-2 text-sm text-ink-muted">
                You'll be charged {formatNaira(round.entryCostMinor)} — {formatNaira(round.stakeMinor)}{' '}
                entry charge + {formatNaira(round.feeMinor)} app charge.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingEntry(false)}
                  className="flex-1 rounded-full bg-ground-raised-2 py-2.5 font-display text-sm text-ink"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={!dialogArmed}
                  onClick={() => {
                    if (!dialogArmed) return
                    setConfirmingEntry(false)
                    handleEnter()
                  }}
                  className="flex-1 rounded-full bg-primary py-2.5 font-display text-sm text-primary-ink disabled:opacity-60"
                >
                  YES, ENTER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-20 z-30 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ground-raised-2 px-4 py-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] sm:max-w-xs"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircleIcon size={18} />
            </span>
            <span className="text-xs font-bold leading-snug text-ink">{confirmation}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center text-center">
        <span className="mb-4 text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          {pendingSettlement
            ? `Round ${pendingSettlement.roundNumber}`
            : round.roundNumber
              ? `Round ${round.roundNumber}`
              : 'Starting soon'}
        </span>

        <DrawRoll
          capacity={round.capacity}
          entered={pendingSettlement ? round.capacity : round.entryCount}
          mySlotNumber={myCurrentEntry?.slotNumber ?? null}
          winnerSlotNumber={revealWinnerSlot}
          revealAt={pendingSettlement?.revealAt ?? null}
        />

        <motion.button
          type="button"
          onClick={() => setConfirmingEntry(true)}
          disabled={entering || !!myCurrentEntry || drawInProgress}
          whileTap={{ scale: 0.95 }}
          className="mt-6 rounded-full bg-primary px-8 py-3 font-display text-base text-primary-ink shadow-[0_8px_22px_-8px_rgba(255,138,126,0.55)] disabled:opacity-60"
        >
          {myCurrentEntry
            ? `YOU'RE IN AT SLOT ${myCurrentEntry.slotNumber}`
            : drawInProgress
              ? 'DRAW IN PROGRESS…'
              : entering
                ? 'ENTERING…'
                : `ENTER ${formatNaira(round.entryCostMinor)}`}
        </motion.button>
        {myCurrentEntry ? (
          <p className="mt-2 text-xs text-ink-muted">Waiting for the draw to complete…</p>
        ) : drawInProgress ? (
          <p className="mt-2 text-xs text-ink-muted">
            A winner is being picked — you can enter the next round once this one's done.
          </p>
        ) : (
          <p className="mt-2 text-xs text-ink-muted">
            {formatNaira(round.stakeMinor)} entry charge + {formatNaira(round.feeMinor)} app charge
          </p>
        )}

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
        of everyone else gets their stake back. The rest fund the winner.
      </p>

      <Link
        to="/how-to-play"
        className="mt-4 flex items-center gap-3 rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-ink transition-colors active:bg-ground"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ground text-primary">
          <QuestionIcon size={18} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">How it works</span>
          <span className="block text-xs text-ink-muted">Entries, payouts, and the draw</span>
        </span>
        <span className="text-ink-muted">
          <ChevronRightIcon size={18} />
        </span>
      </Link>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-wider text-ink-muted">
            Recent entries
          </h2>
          {recentEntries.length > 0 && (
            <Link to="/draw/recent" className="text-[11px] tracking-wide text-primary">
              View all
            </Link>
          )}
        </div>
        {recentEntries.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm text-ink">{entry.user.displayName}</span>
                  <span className="text-[10px] text-ink-muted">
                    Round {entry.roundNumber} · {formatRoundDate(entry.roundDate)} · Slot{' '}
                    {entry.slotNumber}
                  </span>
                </div>
                <span className={`font-display text-xs ${outcomeClass[entry.outcome]}`}>
                  {outcomeLabel[entry.outcome]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-ground-raised px-4 py-4 text-center text-xs text-ink-muted">
            No entries yet. Place your first one above.
          </p>
        )}
      </div>

      <Link
        to="/draw/winners"
        className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-4 transition-colors hover:border-primary/60 hover:bg-primary/15"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-ink">
            <TrophyIcon size={18} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-sm text-primary">Past Winners</span>
            <span className="text-[11px] text-ink-muted">See who's won so far</span>
          </span>
        </span>
        <span className="font-display text-lg text-primary">→</span>
      </Link>

      <CommentFeed />
    </main>
  )
}
