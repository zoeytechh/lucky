import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import Paginator from '../components/Paginator'
import { apiFetch } from '../lib/api'
import { formatRoundDate } from '../lib/date'
import { formatNaira } from '../lib/money'

type Winner = {
  id: string
  roundNumber: number
  roundDate: string
  slotNumber: number
  payoutMinor: string | null
  settledAt: string | null
  user: { id: string; displayName: string }
}

const PAGE_SIZE = 20

export default function Winners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPage = useCallback(async (p: number) => {
    const res = await apiFetch(`/api/draw/winners?page=${p}&pageSize=${PAGE_SIZE}`)
    setWinners(res.winners)
    setTotal(res.total)
  }, [])

  useEffect(() => {
    setLoading(true)
    loadPage(page).finally(() => setLoading(false))
  }, [page, loadPage])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="font-display text-base text-ink">Past winners</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2">
            {winners.map((winner) => (
              <div
                key={winner.id}
                className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm text-ink">{winner.user.displayName}</span>
                  <span className="text-[10px] text-ink-muted">
                    Round {winner.roundNumber} · {formatRoundDate(winner.roundDate)} · Slot{' '}
                    {winner.slotNumber}
                  </span>
                </div>
                <span className="font-display text-xs text-success">
                  {winner.payoutMinor ? formatNaira(winner.payoutMinor) : '—'}
                </span>
              </div>
            ))}
          </div>

          {winners.length === 0 && (
            <p className="mt-8 text-center text-sm text-ink-muted">No winners yet.</p>
          )}

          <Paginator page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  )
}
