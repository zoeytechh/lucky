import { Link } from 'react-router-dom'
import CommentFeed from '../components/CommentFeed'

export default function Comments() {
  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          ← Back
        </Link>
        <h1 className="font-display text-base text-ink">Comments</h1>
      </div>

      <CommentFeed fullPage />
    </main>
  )
}
