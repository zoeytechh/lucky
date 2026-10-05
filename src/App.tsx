import { NavLink, Outlet } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide transition-colors ${
    isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
  }`

function App() {
  return (
    <div className="min-h-screen bg-ground font-body text-ink">
      <nav className="flex items-center justify-between border-b border-hairline bg-ground-raised px-5 py-4">
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
        <div className="text-right">
          <span className="block text-[10px] tracking-wider text-ink-muted">WALLET</span>
          <span className="font-display text-base tabular-nums text-ink">₦18,450</span>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

export default App
