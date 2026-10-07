import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CommentFeed from '../components/CommentFeed'
import DrawRoll from '../components/DrawRoll'
import ErrorAlert from '../components/ErrorAlert'
import { TrophyIcon } from '../components/icons'
import Loader from '../components/Loader'
import WinnerModal from '../components/WinnerModal'
import { ApiError, apiFetch } from '../lib/api'
import { type RoundSettled, useDrawSocket } from '../lib/useDrawSocket'
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
  nextRoundId?: string
  nextRoundNumber?: number
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
  const { progress, settled } = useDrawSocket()
  const [round, setRound] = useState<Round | null>(null)
  const [myEntries, setMyEntries] = useState<MyEntry[]>([])
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [revealWinnerSlot, setRevealWinnerSlot] = useState<number | null>(null)
  // Fed by either the live socket broadcast or, directly, by this user's
  // own POST /api/draw/entries response when it's the one that settles
  // the round — the broadcast alone isn't reliable for that entrant: it
  // can race their page's own socket handshake if they only just
  // connected, which is exactly what left them seeing no reveal at all.
  //
  // A queue, not a single overwritable slot — with ROUND_SIZE small
  // enough for rounds to settle in rapid succession (manual testing),
  // round B could settle while round A's reveal was still mid-suspense;
  // naively overwriting a single pendingSettlement would cancel A's
  // reveal timer outright, leaving that viewer stuck watching numbers
  // roll forever for a round that already finished — and since load()/
  // refreshWallet() only ever run once a reveal actually completes, the
  // same bug also showed up as "my balance/recent entries didn't
  // update". Each queued settlement now gets its own full suspense+
  // reveal cycle, processed one at a time, none dropped.
  const [settlementQueue, setSettlementQueue] = useState<RoundSettled[]>([])
  const [pendingSettlement, setPendingSettlement] = useState<RoundSettled | null>(null)
  const queuedRoundIds = useRef(new Set<string>())

  // A snapshot of whichever settlement last revealed, kept around purely
  // to feed WinnerModal — deliberately separate from pendingSettlement,
  // which the queue-draining effect clears 4s after reveal to pick up the
  // next queued round. The modal has its own lifetime (dismissed by the
  // viewer, or auto-dismissed after a longer hold) that shouldn't be tied
  // to the queue's own pacing.
  const [winnerModalData, setWinnerModalData] = useState<RoundSettled | null>(null)

  const enqueueSettlement = useCallback((s: RoundSettled) => {
    if (queuedRoundIds.current.has(s.roundId)) return
    queuedRoundIds.current.add(s.roundId)
    setSettlementQueue((q) => [...q, s])
  }, [])

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

  // The socket broadcast is one of two ways a settlement gets enqueued —
  // see handleEnter below for the other (this same user's own entry
  // settling the round). Both funnel through enqueueSettlement, whose
  // queuedRoundIds dedupes if both arrive for the same round.
  useEffect(() => {
    if (settled) enqueueSettlement(settled)
  }, [settled, enqueueSettlement])

  // Pulls the next queued settlement once nothing is currently being
  // revealed — this is what makes each one get its own full cycle
  // instead of a later one stomping an earlier one still in progress.
  useEffect(() => {
    if (pendingSettlement || settlementQueue.length === 0) return
    setPendingSettlement(settlementQueue[0])
    setSettlementQueue((q) => q.slice(1))
  }, [settlementQueue, pendingSettlement])

  // Live settlement reveal — fires for every connected viewer the instant
  // the round fills, not just whoever placed the final entry. The backend
  // already knows the winner the moment the round fills, but revealing it
  // that fast reads as anticlimactic — so the numbers keep rolling for a
  // deliberate 30–60s suspense window (random each round, so it never
  // feels mechanically identical) before the winner actually appears.
  useEffect(() => {
    if (!pendingSettlement) return
    const rollDelayMs = 30_000 + Math.random() * 29_000
    const revealTimer = setTimeout(() => {
      setRevealWinnerSlot(pendingSettlement.winnerSlotNumber)
      setWinnerModalData(pendingSettlement)
    }, rollDelayMs)
    return () => clearTimeout(revealTimer)
  }, [pendingSettlement])

  // The modal auto-dismisses if the viewer doesn't close it themselves —
  // long enough to actually read a name/photo, short enough not to block
  // the page indefinitely.
  useEffect(() => {
    if (!winnerModalData) return
    const dismissTimer = setTimeout(() => setWinnerModalData(null), 8000)
    return () => clearTimeout(dismissTimer)
  }, [winnerModalData])

  // Once the winner number is actually shown, hold it on screen briefly
  // before resetting — clearing pendingSettlement here (not just
  // revealWinnerSlot) is what lets the queue-draining effect above pick
  // up the next round, if one settled while this reveal was showing.
  useEffect(() => {
    if (revealWinnerSlot === null) return
    const clearTimer = setTimeout(() => {
      setRevealWinnerSlot(null)
      setPendingSettlement(null)
      load()
      refreshWallet()
    }, 4000)
    return () => clearTimeout(clearTimer)
  }, [revealWinnerSlot, load, refreshWallet])

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
          ? `You're in — slot ${result.slotNumber}. That was the last slot — the draw is starting!`
          : `You're in — slot ${result.slotNumber} of ${round?.capacity}.`,
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
          nextRoundId: result.nextRoundId!,
          nextRoundNumber: result.nextRoundNumber!,
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
  const myWin = winnerModalData
    ? myEntries.find(
        (e) => e.roundId === winnerModalData.roundId && e.slotNumber === winnerModalData.winnerSlotNumber,
      )
    : undefined

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <AnimatePresence>
        {winnerModalData && (
          <WinnerModal
            displayName={winnerModalData.winnerDisplayName}
            avatarUrl={winnerModalData.winnerAvatarUrl}
            slotNumber={winnerModalData.winnerSlotNumber}
            payoutMinor={round.winnerPayoutMinor}
            isYou={!!myWin}
            onClose={() => setWinnerModalData(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center text-center">
        <span className="mb-4 text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          {round.roundNumber ? `Round ${round.roundNumber}` : 'Starting soon'}
        </span>

        <DrawRoll
          capacity={round.capacity}
          entered={round.entryCount}
          mySlotNumber={myCurrentEntry?.slotNumber ?? null}
          winnerSlotNumber={revealWinnerSlot}
        />

        <motion.button
          type="button"
          onClick={handleEnter}
          disabled={entering || !!myCurrentEntry}
          whileTap={{ scale: 0.95 }}
          className="mt-6 rounded-full bg-primary px-8 py-3 font-display text-base text-primary-ink shadow-[0_8px_22px_-8px_rgba(255,138,126,0.55)] disabled:opacity-60"
        >
          {myCurrentEntry
            ? `YOU'RE IN — SLOT ${myCurrentEntry.slotNumber}`
            : entering
              ? 'ENTERING…'
              : `ENTER ${formatNaira(round.entryCostMinor)}`}
        </motion.button>
        {myCurrentEntry ? (
          <p className="mt-2 text-xs text-ink-muted">Waiting for the draw to complete…</p>
        ) : (
          <p className="mt-2 text-xs text-ink-muted">
            {formatNaira(round.stakeMinor)} stake + {formatNaira(round.feeMinor)} fee
          </p>
        )}

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
            No entries yet — place your first one above.
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
