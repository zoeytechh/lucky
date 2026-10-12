import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrophyIcon } from '../components/Icons'
import Skeleton from '../components/Skeleton'
import { apiFetch } from '../lib/api'
import { formatNaira } from '../lib/money'

type RoundInfo = {
  capacity: number
  entryCostMinor: string
  stakeMinor: string
  feeMinor: string
  winnerPayoutMinor: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-sm uppercase tracking-wide text-primary">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  )
}

/**
 * A standing reference page, not a one-time onboarding step (that's
 * LoginIntro) — reachable any time from the nav for a user who wants to
 * re-check how the money math works. Pulls the real round numbers from
 * the backend rather than hardcoding them (same reasoning as the Enter
 * button's fee caption), so this can never quietly drift from whatever
 * ENTRY_COST_MINOR/STAKE_MINOR/etc. actually are.
 */
export default function HowToPlay() {
  const [round, setRound] = useState<RoundInfo | null>(null)

  useEffect(() => {
    apiFetch('/api/draw/current').then(setRound)
  }, [])

  // This page is almost entirely static explainer copy — sections 3-5
  // below never touch `round` at all. Only a handful of numbers in
  // sections 1-2 come from the backend, so only those wait: the page
  // itself renders immediately, each dynamic spot shows a skeleton
  // shaped like the value that's coming until the fetch resolves.
  const nonWinnerCount = round ? round.capacity - 1 : null
  const refundCount = nonWinnerCount !== null ? Math.ceil(nonWinnerCount / 2) : null
  const lossCount = nonWinnerCount !== null ? Math.floor(nonWinnerCount / 2) : null

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">How Lucky You works</h1>
      <p className="mt-1 text-xs text-ink-muted">
        Everything that happens between paying your entry fee and seeing money in your wallet.
      </p>

      <Section title="1. Enter a round">
        <p>
          Every entry costs{' '}
          {round ? formatNaira(round.entryCostMinor) : <Skeleton className="inline-block h-3.5 w-14 align-middle" />}
          : {round ? formatNaira(round.stakeMinor) : <Skeleton className="inline-block h-3.5 w-14 align-middle" />}{' '}
          goes into the prize pool as your stake, and{' '}
          {round ? formatNaira(round.feeMinor) : <Skeleton className="inline-block h-3.5 w-12 align-middle" />} is
          the platform's app fee, kept regardless of the outcome.
        </p>
        <p>
          A round fills with exactly{' '}
          {round ? round.capacity.toLocaleString() : <Skeleton className="inline-block h-3.5 w-10 align-middle" />}{' '}
          entries. The instant the last slot is taken, the round settles immediately and a new one
          opens right away. Rounds aren't on a timer, they fill whenever they fill.
        </p>
      </Section>

      <Section title="2. One shuffle decides everyone's outcome">
        <p>
          Once the round is full, a single cryptographically-secure shuffle of every entry
          decides three things at once:
        </p>
        <div className="flex flex-col gap-2">
          <div className="card-raised-sm flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            <span>1 winner</span>
            {round ? (
              <span className="font-display text-success">{formatNaira(round.winnerPayoutMinor)}</span>
            ) : (
              <Skeleton className="h-4 w-16" />
            )}
          </div>
          <div className="card-raised-sm flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            {refundCount !== null ? (
              <span>{refundCount.toLocaleString()} refunded</span>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
            {round ? (
              <span className="font-display text-ink">{formatNaira(round.stakeMinor)} back</span>
            ) : (
              <Skeleton className="h-4 w-16" />
            )}
          </div>
          <div className="card-raised-sm flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            {lossCount !== null ? (
              <span>{lossCount.toLocaleString()} lose their stake</span>
            ) : (
              <Skeleton className="h-4 w-28" />
            )}
            <span className="font-display text-danger">₦0</span>
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          The math always balances exactly: the winner's prize plus every refund adds up to the
          total stake collected from the round. The entries that lose are what funds the winner's
          payout beyond their own stake.
        </p>
      </Section>

      <Section title="3. Watch it happen live">
        <p>
          Everyone looking at the Draw page sees the same round fill in real time. The ring
          advances on every entry, not just your own. Once it's full, the numbers roll for a
          short suspense window before the winner's name, photo, and prize appear for everyone at
          once.
        </p>
      </Section>

      <Section title="4. Your wallet">
        <p>
          Fund your wallet by bank transfer or card, and spend from it to enter rounds. Every win,
          refund, deposit, and withdrawal is recorded as a permanent line in your wallet's
          transaction history. You can always see exactly where every Naira came from or went.
          Cash out to your bank account whenever you want.
        </p>
      </Section>

      <Section title="5. Daily leaderboard">
        <p>
          Separately from the draw, the top spenders each calendar day are ranked on the
          Leaderboard page. The top 3 are gifted a cash prize, credited straight to their wallet,
          funded from platform fees, never from draw stake money.
        </p>
      </Section>

      <Link
        to="/draw/winners"
        className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-4 transition-colors hover:border-primary/60 hover:bg-primary/15"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-ink">
            <TrophyIcon size={18} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-sm text-primary">Past Winners</span>
            <span className="text-[11px] text-ink-muted">See who's actually won so far</span>
          </span>
        </span>
        <span className="font-display text-lg text-primary">→</span>
      </Link>
    </main>
  )
}
