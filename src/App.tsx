import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import Loader from './components/Loader'
import { useAuth } from './lib/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide transition-colors ${
    isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
  }`

function App() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground">
        <Loader size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'USER' && !user.avatarUrl) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-screen bg-ground font-body text-ink">
      <nav className="flex items-center justify-between border-b border-hairline bg-ground-raised px-5 py-3.5">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="font-display text-lg tracking-wide text-primary">
            LUCKY
          </NavLink>
          <div className="flex gap-5">
            <NavLink to="/" end className={navLinkClass}>
              Draw
            </NavLink>
            <NavLink to="/wallet" className={navLinkClass}>
              Wallet
            </NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>
              Leaderboard
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <span className="block text-[10px] tracking-wider text-ink-muted">WALLET</span>
            <span className="font-display text-sm tabular-nums text-ink">₦18,450</span>
          </div>
          <Link
            to="/profile"
            title="Profile"
            className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-hairline"
          >
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt="Your profile"
                className="h-full w-full object-cover"
              />
            )}
          </Link>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

export default App
