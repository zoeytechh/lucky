import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import { apiFetch } from '../lib/api'

type Entry = {
  id: string
  roundNumber: number
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

const PAGE_SIZE = 25

export default function RecentEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadPage = useCallback(async (offset: number) => {
    const res = await apiFetch(`/api/draw/recent-entries?limit=${PAGE_SIZE}&offset=${offset}`)
    return res.entries as Entry[]
  }, [])

  useEffect(() => {
    loadPage(0)
      .then((page) => {
        setEntries(page)
        setHasMore(page.length === PAGE_SIZE)
      })
      .finally(() => setLoading(false))
  }, [loadPage])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const page = await loadPage(entries.length)
      setEntries((prev) => [...prev, ...page])
      setHasMore(page.length === PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="font-display text-base text-ink">Recent entries</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
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
                    Round {entry.roundNumber} · Slot {entry.slotNumber}
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

          {hasMore && entries.length > 0 && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-5 w-full rounded-full border border-hairline py-2.5 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </main>
  )
}
