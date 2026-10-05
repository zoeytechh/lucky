import RoundRing from '../components/RoundRing'

// Static placeholder content — wired to real round/wallet state once the
// draw backend (build-order step 3) and wallet (step 2) exist.
const ROUND_NUMBER = 4812
const ENTERED = 738
const CAPACITY = 1000

export default function Draw() {
  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 text-[11px] uppercase tracking-[0.15em] text-ink-muted">
          Round {ROUND_NUMBER}
        </span>

        <RoundRing entered={ENTERED} capacity={CAPACITY} />

        <button
          type="button"
          className="mt-6 rounded-full bg-primary px-8 py-3 font-display text-base text-primary-ink shadow-[0_8px_22px_-8px_rgba(255,138,126,0.55)] transition-transform active:scale-95"
        >
          ENTER — ₦1,200
        </button>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 border-y border-hairline py-4 text-center">
        <div>
          <span className="block font-display text-sm text-success">₦500,000</span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Winner</span>
        </div>
        <div>
          <span className="block font-display text-sm text-ink">₦1,000</span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Refunded</span>
        </div>
        <div>
          <span className="block font-display text-sm text-danger">499</span>
          <span className="mt-1 block text-[10px] tracking-wide text-ink-muted">Lose it</span>
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
        1,000 entries a round. One winner takes half the pool. Half of
        everyone else gets their stake back — the rest fund the winner.
      </p>
    </main>
  )
}
