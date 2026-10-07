type Props = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/**
 * Numbered pagination, not "load more" — each click requests exactly
 * that page from the backend (see RecentEntries.tsx / Winners.tsx), never
 * accumulates previously-seen rows client-side. Shows a small window of
 * page numbers around the current one plus first/last, since history
 * grows indefinitely (~100 rounds/day) and a full page-number list isn't
 * practical past a few dozen pages.
 */
export default function Paginator({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1].filter(
    (p) => p >= 1 && p <= totalPages,
  ))
  const sorted = [...pages].sort((a, b) => a - b)

  const items: (number | 'gap')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push('gap')
    items.push(p)
    prev = p
  }

  return (
    <nav className="mt-5 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-full px-3 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
      >
        Prev
      </button>
      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`min-w-[28px] rounded-full px-2.5 py-1.5 text-xs transition-colors ${
              item === page
                ? 'bg-primary font-display text-primary-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full px-3 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  )
}
