import { useEffect, useState } from 'react'
import AnimatedBalance from '../components/AnimatedBalance'
import Loader from '../components/Loader'
import { apiFetch } from '../lib/api'
import { formatNaira } from '../lib/money'
import { useWallet } from '../lib/WalletContext'

type Transaction = {
  id: string
  amountMinor: string
  entryType: string
  createdAt: string
}

const typeLabel: Record<string, string> = {
  DEPOSIT: 'Deposit',
  DRAW_ENTRY_STAKE: 'Draw entry (stake)',
  DRAW_ENTRY_FEE: 'Draw entry (fee)',
  DRAW_WINNER_PAYOUT: 'Draw winnings',
  DRAW_REFUND: 'Draw refund',
  LEADERBOARD_PRIZE: 'Leaderboard prize',
  WITHDRAWAL: 'Withdrawal',
  WITHDRAWAL_REVERSAL: 'Withdrawal reversed',
}

export default function Wallet() {
  const { balanceMinor, loading: balanceLoading } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)

  useEffect(() => {
    apiFetch('/api/wallet/transactions?limit=20').then((res) =>
      setTransactions(res.transactions),
    )
  }, [])

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Wallet</h1>

      <div className="mt-5 rounded-xl bg-ground-raised px-5 py-6 text-center">
        <span className="block text-[11px] tracking-wider text-ink-muted">BALANCE</span>
        {balanceLoading ? (
          <span className="mt-1 block font-display text-3xl tabular-nums text-primary">—</span>
        ) : (
          <AnimatedBalance
            balanceMinor={balanceMinor}
            className="mt-1 block font-display text-3xl tabular-nums text-primary"
          />
        )}

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-full bg-primary px-5 py-2 font-display text-sm text-primary-ink disabled:opacity-40"
          >
            DEPOSIT
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-full border border-hairline px-5 py-2 font-display text-sm text-ink disabled:opacity-40"
          >
            WITHDRAW
          </button>
        </div>
        <p className="mt-3 text-[10px] text-ink-muted">
          Deposits and withdrawals are coming soon.
        </p>
      </div>

      <h2 className="mt-8 text-[11px] uppercase tracking-wider text-ink-muted">
        Recent activity
      </h2>

      {transactions === null ? (
        <div className="mt-3 flex items-center justify-center rounded-xl border border-hairline py-10">
          <Loader label="Loading" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="mt-3 rounded-xl border border-hairline py-10 text-center text-xs text-ink-muted">
          No activity yet.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {transactions.map((tx) => {
            const isCredit = !tx.amountMinor.startsWith('-')
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
              >
                <div>
                  <span className="block text-sm text-ink">
                    {typeLabel[tx.entryType] ?? tx.entryType}
                  </span>
                  <span className="block text-[10px] text-ink-muted">
                    {new Date(tx.createdAt).toLocaleString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span
                  className={`font-display text-sm tabular-nums ${isCredit ? 'text-success' : 'text-ink'}`}
                >
                  {isCredit ? '+' : ''}
                  {formatNaira(tx.amountMinor)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
