import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Paginator from '../components/Paginator'
import Skeleton from '../components/Skeleton'
import { apiFetch } from '../lib/api'
import { formatRoundDate } from '../lib/date'

type Entry = {
  id: string
  roundNumber: number
  roundDate: string
  slotNumber: number
  outcome: 'PENDING' | 'WON' | 'REFUNDED' | 'LOST'
  payoutMinor: string | null
  enteredAt: string
  user: { id: string; displayName: string }
}

const outcomeLabel: Record<Entry['outcome'], string> = {
  PENDING: 'Pending',
  WON: 'Won',
  REFUNDED: 'Refunded',
  LOST: 'Lost',
}
const outcomeClass: Record<Entry['outcome'], string> = {
  PENDING: 'text-ink-muted',
  WON: 'text-success',
  REFUNDED: 'text-ink',
  LOST: 'text-danger',
}

const PAGE_SIZE = 20

export default function RecentEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPage = useCallback(async (p: number) => {
    const res = await apiFetch(`/api/draw/recent-entries?page=${p}&pageSize=${PAGE_SIZE}`)
    setEntries(res.entries)
    setTotal(res.total)
  }, [])

  useEffect(() => {
    setLoading(true)
    loadPage(page).finally(() => setLoading(false))
  }, [page, loadPage])

  // Same reasoning as Draw.tsx's own version of this: a tab left open on
  // this page and returned to later had no reason to show a newer entry
  // placed in the meantime — only a page-number click or a fresh mount
  // ever re-fetched. No loading flicker here, unlike the mount effect
  // above — this is a silent catch-up, not a first load.
  useEffect(() => {
    function refetchIfVisible() {
      if (document.visibilityState === 'visible') loadPage(page)
    }
    document.addEventListener('visibilitychange', refetchIfVisible)
    window.addEventListener('focus', refetchIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', refetchIfVisible)
      window.removeEventListener('focus', refetchIfVisible)
    }
  }, [page, loadPage])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="font-display text-base text-ink">Recent entries</h1>
      </div>

      {loading ? (
        <div className="mt-5 flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-ground-raised px-4 py-2.5"
            >
              <div className="flex flex-col items-start gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-3.5 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2">
            {entries.map((entry) => (
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

          {entries.length === 0 && (
            <p className="mt-8 text-center text-sm text-ink-muted">No entries yet.</p>
          )}

          <Paginator page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  )
}
