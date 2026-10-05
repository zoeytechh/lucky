import Loader from '../components/Loader'

// Static placeholder — wired to real balance/ledger (build-order step 2)
// and Paystack deposit/withdraw flows (steps 5–6).
export default function Wallet() {
  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">
        Wallet
      </h1>

      <div className="mt-5 rounded-xl bg-ground-raised px-5 py-6 text-center">
        <span className="block text-[11px] tracking-wider text-ink-muted">
          BALANCE
        </span>
        <span className="mt-1 block font-display text-3xl tabular-nums text-primary">
          ₦18,450
        </span>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-2 font-display text-sm text-primary-ink"
          >
            DEPOSIT
          </button>
          <button
            type="button"
            className="rounded-full border border-hairline px-5 py-2 font-display text-sm text-ink"
          >
            WITHDRAW
          </button>
        </div>
      </div>

      <h2 className="mt-8 text-[11px] uppercase tracking-wider text-ink-muted">
        Recent activity
      </h2>
      <div className="mt-3 flex items-center justify-center rounded-xl border border-hairline py-10">
        <Loader label="Loading" />
      </div>
    </main>
  )
}
