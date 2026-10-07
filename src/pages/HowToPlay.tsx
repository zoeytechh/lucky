import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import { TrophyIcon } from '../components/icons'
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

  if (!round) {
    return (
      <main className="flex justify-center py-16">
        <Loader size="lg" />
      </main>
    )
  }

  const nonWinnerCount = round.capacity - 1
  const refundCount = Math.ceil(nonWinnerCount / 2)
  const lossCount = Math.floor(nonWinnerCount / 2)

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">How Lucky works</h1>
      <p className="mt-1 text-xs text-ink-muted">
        Everything that happens between paying your entry fee and seeing money in your wallet.
      </p>

      <Section title="1. Enter a round">
        <p>
          Every entry costs {formatNaira(round.entryCostMinor)} — {formatNaira(round.stakeMinor)}{' '}
          goes into the prize pool as your stake, and {formatNaira(round.feeMinor)} is the
          platform's app fee, kept regardless of the outcome.
        </p>
        <p>
          A round fills with exactly {round.capacity.toLocaleString()} entries. The instant the
          last slot is taken, the round settles immediately and a new one opens right away —
          rounds aren't on a timer, they fill whenever they fill.
        </p>
      </Section>

      <Section title="2. One shuffle decides everyone's outcome">
        <p>
          Once the round is full, a single cryptographically-secure shuffle of every entry
          decides three things at once:
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            <span>1 winner</span>
            <span className="font-display text-success">
              {formatNaira(round.winnerPayoutMinor)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            <span>{refundCount.toLocaleString()} refunded</span>
            <span className="font-display text-ink">{formatNaira(round.stakeMinor)} back</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5">
            <span>{lossCount.toLocaleString()} lose their stake</span>
            <span className="font-display text-danger">₦0</span>
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          The math always balances exactly — the winner's prize plus every refund adds up to the
          total stake collected from the round. The entries that lose are what funds the winner's
          payout beyond their own stake.
        </p>
      </Section>

      <Section title="3. Watch it happen live">
        <p>
          Everyone looking at the Draw page sees the same round fill in real time — the ring
          advances on every entry, not just your own. Once it's full, the numbers roll for a
          short suspense window before the winner's name, photo, and prize appear for everyone at
          once.
        </p>
      </Section>

      <Section title="4. Your wallet">
        <p>
          Fund your wallet by bank transfer or card, and spend from it to enter rounds. Every win,
          refund, deposit, and withdrawal is recorded as a permanent line in your wallet's
          transaction history — you can always see exactly where every Naira came from or went.
          Cash out to your bank account whenever you want.
        </p>
      </Section>

      <Section title="5. Daily leaderboard">
        <p>
          Separately from the draw, the top spenders each calendar day are ranked on the
          Leaderboard page. The top 3 are gifted a cash prize, credited straight to their wallet —
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
