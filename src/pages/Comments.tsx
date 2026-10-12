import { Link } from 'react-router-dom'
import CommentFeed from '../components/CommentFeed'

export default function Comments() {
  return (
    <main className="mx-auto max-w-sm px-5 pb-8 lg:max-w-2xl">
      {/* Sticky right below the app's own sticky nav (61px tall) — a
          long, ever-growing comment thread is the whole point of this
          page, so Back needs to stay reachable without scrolling back
          up to find it. */}
      <div className="sticky top-15.25 z-10 -mx-5 flex items-center gap-3 border-b border-hairline bg-ground px-5 py-4">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="font-display text-base text-ink">Comments</h1>
      </div>

      <div className="pt-4">
        <CommentFeed fullPage />
      </div>
    </main>
  )
}
