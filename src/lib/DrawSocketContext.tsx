import { AnimatePresence } from 'motion/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import AlmostFullToast from '../components/AlmostFullToast'
import DrawStartedToast from '../components/DrawStartedToast'
import WinnerModal from '../components/WinnerModal'
import WinnerToast from '../components/WinnerToast'
import { apiFetch } from './api'
import { type RoundProgress, type RoundSettled, useDrawSocket } from './useDrawSocket'
import { useWallet } from './WalletContext'

type DrawSocketState = {
  progress: RoundProgress | null
  pendingSettlement: RoundSettled | null
  revealWinnerSlot: number | null
  enqueueSettlement: (s: RoundSettled) => void
}

const DrawSocketContext = createContext<DrawSocketState | null>(null)

// Dedupes the catch-up announcement across reloads/navigation within the
// same browser — a round already announced (live or caught up) is never
// shown again just because the provider remounted or the app reopened a
// minute later.
const LAST_SEEN_ROUND_KEY = 'lucky_last_announced_round_id'

// How recent a fully-concluded settlement has to be, in ms, for a viewer
// who missed it entirely (app closed/backgrounded through the whole
// reveal) to still get a catch-up announcement on the next load — wide
// enough to cover "stepped away for a minute or two", narrow enough that
// reopening the app hours later doesn't resurface old news.
const CATCH_UP_RECENCY_MS = 3 * 60 * 1000

/**
 * Owns the one app-wide connection to the public round socket and
 * everything downstream of it: the ring-driving suspense/reveal sequence
 * (consumed by Draw.tsx via useDrawSocketContext) and the global winner
 * announcement (rendered right here, so it shows up no matter which page
 * the viewer is actually on — this used to live entirely inside Draw.tsx,
 * which meant navigating away mid-reveal, or being away when one
 * happened, meant missing it completely).
 *
 * Mounted once in App.tsx, above the routed Outlet, specifically so it
 * survives navigation between pages instead of resetting on every route
 * change the way page-local state would.
 */
export function DrawSocketProvider({ children }: { children: ReactNode }) {
  const { progress, settled } = useDrawSocket()
  const { refresh: refreshWallet } = useWallet()
  // The Draw page already shows the ring/suspense build-up, so everyone
  // watching it gets the full celebratory modal when it resolves —
  // winner or not. Only away from Draw does the split kick in: winner
  // still gets the full modal (it's about them, wherever they are),
  // everyone else gets the lighter toast instead of a full interrupt.
  const onDrawPage = useLocation().pathname === '/'

  // Ring-driving state — same shape/behavior as Draw.tsx used to own
  // directly, just lifted up so it isn't destroyed by a route change.
  const [settlementQueue, setSettlementQueue] = useState<RoundSettled[]>([])
  const [pendingSettlement, setPendingSettlement] = useState<RoundSettled | null>(null)
  const [revealWinnerSlot, setRevealWinnerSlot] = useState<number | null>(null)
  const queuedRoundIds = useRef(new Set<string>())

  // The global announcement — deliberately separate from pendingSettlement
  // above: a catch-up announcement for a round that's already fully
  // concluded (see the /last-settled effect below) must NOT also make
  // drawInProgress true on the Draw page, since the actual current round
  // is already open and accepting entries by the time that happens.
  const [announcement, setAnnouncement] = useState<RoundSettled | null>(null)
  // null = not yet determined — neither the modal nor the toast renders
  // until this resolves, so an actual winner never sees the toast flash
  // briefly before switching to the modal.
  const [isYouWin, setIsYouWin] = useState<boolean | null>(null)
  const announcedRoundIds = useRef(new Set<string>())

  // "Almost full" — the other half of the notification ask, alongside
  // the winner announcement above: a nudge to come join before a round
  // closes, for anyone not already looking at the ring fill up live.
  const [almostFull, setAlmostFull] = useState<RoundProgress | null>(null)
  const almostFullNotifiedRoundIds = useRef(new Set<string>())
  // Same tri-state pattern as isYouWin below: someone already in this
  // round doesn't need "join now" — they need "it's about to start"
  // instead. null = not yet determined, so neither copy renders until
  // this resolves.
  const [isAlmostFullEntrant, setIsAlmostFullEntrant] = useState<boolean | null>(null)

  // "Draw started" — the literal "it's full now" moment, distinct from
  // the almost-full nudge above (which fires one entry early — a real
  // gap at the actual 1000-entry round size, not just the small testing
  // one). Entrant-only: someone who never joined this round has nothing
  // to watch for here.
  const [drawStarted, setDrawStarted] = useState<RoundProgress | null>(null)
  const drawStartedNotifiedRoundIds = useRef(new Set<string>())
  const [isDrawStartedEntrant, setIsDrawStartedEntrant] = useState<boolean | null>(null)

  const enqueueSettlement = useCallback((s: RoundSettled) => {
    if (queuedRoundIds.current.has(s.roundId)) return
    queuedRoundIds.current.add(s.roundId)
    setSettlementQueue((q) => [...q, s])
  }, [])

  const announce = useCallback((s: RoundSettled) => {
    if (announcedRoundIds.current.has(s.roundId)) return
    announcedRoundIds.current.add(s.roundId)
    localStorage.setItem(LAST_SEEN_ROUND_KEY, s.roundId)
    setAnnouncement(s)
  }, [])

  // On mount: catch up on whatever's already true, covering both ways a
  // viewer can land here without having watched a reveal live —
  // (1) a reveal still genuinely in progress right now (same `drawing`
  // field Draw.tsx's own load() used to check), which joins the normal
  // suspense/reveal pipeline like any live one; (2) one that fully
  // concluded while this session was closed or backgrounded, which skips
  // straight to the announcement — there's nothing left to count down to.
  useEffect(() => {
    ;(async () => {
      try {
        const current = await apiFetch('/api/draw/current')
        if (current.drawing) {
          enqueueSettlement({
            roundId: current.drawing.roundId,
            roundNumber: current.drawing.roundNumber,
            winnerSlotNumber: current.drawing.winnerSlotNumber,
            winnerDisplayName: current.drawing.winnerDisplayName,
            winnerAvatarUrl: current.drawing.winnerAvatarUrl,
            winnerPayoutMinor: current.winnerPayoutMinor,
            revealAt: current.drawing.revealAt,
            nextRoundId: current.roundId,
            nextRoundNumber: current.roundNumber,
            nextEntriesOpenAt: current.entriesOpenAt,
          })
          return
        }
        if (current.roundId && current.entryCount < current.capacity) {
          const threshold = Math.min(current.capacity - 1, Math.floor(current.capacity * 0.9))
          if (
            current.entryCount >= threshold &&
            !almostFullNotifiedRoundIds.current.has(current.roundId)
          ) {
            almostFullNotifiedRoundIds.current.add(current.roundId)
            setAlmostFull({
              roundId: current.roundId,
              roundNumber: current.roundNumber,
              entryCount: current.entryCount,
              capacity: current.capacity,
            })
          }
        }
      } catch {
        // a failed catch-up check shouldn't block the rest of the app
      }

      try {
        const { result } = await apiFetch('/api/draw/last-settled')
        if (!result) return
        if (localStorage.getItem(LAST_SEEN_ROUND_KEY) === result.roundId) return
        const settledAgoMs = Date.now() - new Date(result.settledAt).getTime()
        if (settledAgoMs > CATCH_UP_RECENCY_MS) {
          localStorage.setItem(LAST_SEEN_ROUND_KEY, result.roundId)
          return
        }
        announce({
          roundId: result.roundId,
          roundNumber: result.roundNumber,
          winnerSlotNumber: result.winnerSlotNumber,
          winnerDisplayName: result.winnerDisplayName,
          winnerAvatarUrl: result.winnerAvatarUrl,
          winnerPayoutMinor: result.payoutMinor,
          revealAt: result.settledAt,
          nextRoundId: '',
          nextRoundNumber: 0,
          nextEntriesOpenAt: new Date().toISOString(),
        })
      } catch {
        // same — not fatal, just means no catch-up this load
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })()
  }, [])

  // The socket broadcast is one of two ways a settlement gets enqueued —
  // see Draw.tsx's handleEnter for the other (this same user's own entry
  // settling the round). Both funnel through enqueueSettlement, whose
  // queuedRoundIds dedupes if both arrive for the same round.
  useEffect(() => {
    if (settled) enqueueSettlement(settled)
  }, [settled, enqueueSettlement])

  // Fires once per round, the first time entryCount crosses whichever's
  // earlier of "one slot left" or 90% full — the former matters for a
  // small test-size round (e.g. 3 of 4), the latter gives a meaningful
  // head start on a real 1000-entry one (900 of 1000), instead of a
  // threshold that's effectively "already full" either way.
  useEffect(() => {
    if (!progress) return
    if (almostFullNotifiedRoundIds.current.has(progress.roundId)) return
    if (progress.entryCount >= progress.capacity) return
    const threshold = Math.min(progress.capacity - 1, Math.floor(progress.capacity * 0.9))
    if (progress.entryCount < threshold) return
    almostFullNotifiedRoundIds.current.add(progress.roundId)
    setAlmostFull(progress)
  }, [progress])

  // Fires once per round, the instant entryCount actually reaches
  // capacity — the moment the almost-full nudge above was only ever a
  // heads-up for.
  useEffect(() => {
    if (!progress) return
    if (drawStartedNotifiedRoundIds.current.has(progress.roundId)) return
    if (progress.entryCount < progress.capacity) return
    drawStartedNotifiedRoundIds.current.add(progress.roundId)
    setDrawStarted(progress)
  }, [progress])

  // Pulls the next queued settlement once nothing is currently being
  // revealed — each queued round gets its own full suspense+reveal
  // cycle, processed one at a time, none dropped.
  useEffect(() => {
    if (pendingSettlement || settlementQueue.length === 0) return
    setPendingSettlement(settlementQueue[0])
    setSettlementQueue((q) => q.slice(1))
  }, [settlementQueue, pendingSettlement])

  // Counts down to the server-decided revealAt — the same instant every
  // viewer converges on, whether they've been watching since the round
  // filled or just joined mid-reveal via the catch-up above.
  useEffect(() => {
    if (!pendingSettlement) return
    const delayMs = Math.max(0, new Date(pendingSettlement.revealAt).getTime() - Date.now())
    const revealTimer = setTimeout(() => {
      setRevealWinnerSlot(pendingSettlement.winnerSlotNumber)
      announce(pendingSettlement)
    }, delayMs)
    return () => clearTimeout(revealTimer)
  }, [pendingSettlement, announce])

  // Holds the winner number until nextEntriesOpenAt — the same instant
  // that's also the actual backend-enforced gate on the next round's
  // entries — then clears pendingSettlement so the queue can pick up
  // whatever settled next, and refreshes the wallet (a payout may have
  // just landed) regardless of which page the viewer is currently on.
  useEffect(() => {
    if (revealWinnerSlot === null || !pendingSettlement) return
    const holdMs = Math.max(0, new Date(pendingSettlement.nextEntriesOpenAt).getTime() - Date.now())
    const clearTimer = setTimeout(() => {
      setRevealWinnerSlot(null)
      setPendingSettlement(null)
      refreshWallet()
    }, holdMs)
    return () => clearTimeout(clearTimer)
  }, [revealWinnerSlot, pendingSettlement, refreshWallet])

  // Once announced, figure out whether this viewer is the winner — a
  // separate check from the ring's own myCurrentEntry logic on the Draw
  // page, since this has to work from any page without depending on
  // Draw.tsx's own locally-fetched entries.
  useEffect(() => {
    if (!announcement) {
      setIsYouWin(null)
      return
    }
    setIsYouWin(null)
    let cancelled = false
    apiFetch('/api/draw/entries?limit=5')
      .then(({ entries }: { entries: { roundId: string; slotNumber: number }[] }) => {
        if (cancelled) return
        const won = entries.some(
          (e) => e.roundId === announcement.roundId && e.slotNumber === announcement.winnerSlotNumber,
        )
        setIsYouWin(won)
      })
      .catch(() => {
        if (!cancelled) setIsYouWin(false)
      })
    return () => {
      cancelled = true
    }
  }, [announcement])

  // Same check as isYouWin above, for the almost-full nudge instead of
  // the winner announcement — is the viewer already an entrant of the
  // round that just crossed the threshold.
  useEffect(() => {
    if (!almostFull) {
      setIsAlmostFullEntrant(null)
      return
    }
    setIsAlmostFullEntrant(null)
    let cancelled = false
    apiFetch('/api/draw/entries?limit=5')
      .then(({ entries }: { entries: { roundId: string }[] }) => {
        if (cancelled) return
        setIsAlmostFullEntrant(entries.some((e) => e.roundId === almostFull.roundId))
      })
      .catch(() => {
        if (!cancelled) setIsAlmostFullEntrant(false)
      })
    return () => {
      cancelled = true
    }
  }, [almostFull])

  // Same check again, for the draw-started toast — entrant-only, so this
  // doubles as the render gate (non-entrants get null/false and never
  // see it at all, unlike almostFull's tri-state which still renders
  // either way just with different copy).
  useEffect(() => {
    if (!drawStarted) {
      setIsDrawStartedEntrant(null)
      return
    }
    setIsDrawStartedEntrant(null)
    let cancelled = false
    apiFetch('/api/draw/entries?limit=5')
      .then(({ entries }: { entries: { roundId: string }[] }) => {
        if (cancelled) return
        setIsDrawStartedEntrant(entries.some((e) => e.roundId === drawStarted.roundId))
      })
      .catch(() => {
        if (!cancelled) setIsDrawStartedEntrant(false)
      })
    return () => {
      cancelled = true
    }
  }, [drawStarted])

  return (
    <DrawSocketContext.Provider value={{ progress, pendingSettlement, revealWinnerSlot, enqueueSettlement }}>
      {children}

      <AnimatePresence>
        {announcement && (onDrawPage || isYouWin === true) && (
          <WinnerModal
            displayName={announcement.winnerDisplayName}
            avatarUrl={announcement.winnerAvatarUrl}
            slotNumber={announcement.winnerSlotNumber}
            payoutMinor={announcement.winnerPayoutMinor}
            isYou={isYouWin === true}
            onClose={() => setAnnouncement(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {announcement && !onDrawPage && isYouWin === false && (
          <WinnerToast
            displayName={announcement.winnerDisplayName}
            avatarUrl={announcement.winnerAvatarUrl}
            payoutMinor={announcement.winnerPayoutMinor}
            onClose={() => setAnnouncement(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {almostFull && !onDrawPage && isAlmostFullEntrant !== null && (
          <AlmostFullToast
            roundNumber={almostFull.roundNumber}
            entryCount={almostFull.entryCount}
            capacity={almostFull.capacity}
            youAreIn={isAlmostFullEntrant}
            onClose={() => setAlmostFull(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawStarted && !onDrawPage && isDrawStartedEntrant === true && (
          <DrawStartedToast
            roundNumber={drawStarted.roundNumber}
            onClose={() => setDrawStarted(null)}
          />
        )}
      </AnimatePresence>
    </DrawSocketContext.Provider>
  )
}

export function useDrawSocketContext() {
  const ctx = useContext(DrawSocketContext)
  if (!ctx) throw new Error('useDrawSocketContext must be used within DrawSocketProvider')
  return ctx
}
