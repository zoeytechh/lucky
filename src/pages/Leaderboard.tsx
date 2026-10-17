// Static placeholder rows — wired to the real daily leaderboard job
// (build-order step 7) once it exists. All three show the same prize
// amount on purpose: the agreed formula is 2% of that day's fee revenue
// split evenly three ways, not a declining 1st/2nd/3rd tier — rank only
// decides *who* qualifies, not how much they get.
const TOP_THREE = [
  { rank: 1, name: 'Tolu A.', amount: '₦13,333' },
  { rank: 2, name: 'Kelechi O.', amount: '₦13,333' },
  { rank: 3, name: 'Blessing N.', amount: '₦13,333' },
]

export default function Leaderboard() {
  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">
        Today's Top 3
      </h1>
      <p className="mt-1 text-xs text-ink-muted">
        Ranked by total spent today. Entries break ties.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {TOP_THREE.map((row) => (
          <div
            key={row.rank}
            className="card-raised flex items-center gap-3 rounded-xl bg-ground-raised px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-ink">
              {row.rank}
            </span>
            <span className="flex-1 text-sm text-ink">{row.name}</span>
            <span className="font-display text-sm tabular-nums text-primary">
              {row.amount}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-muted">
        Prize: 2% of today's fee revenue, split evenly between the top 3 — same amount for every
        spot, win or tie.
      </p>
    </main>
  )
}
