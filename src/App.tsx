import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import AnimatedBalance from './components/AnimatedBalance'
import Loader from './components/Loader'
import MobileMenu from './components/MobileMenu'
import PartyMascot from './components/PartyMascot'
import { WalletIcon } from './components/icons'
import { useAuth } from './lib/AuthContext'
import { useWallet } from './lib/WalletContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide transition-colors ${
    isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
  }`

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M3 6h16M3 11h16M3 16h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function App() {
  const { status, user } = useAuth()
  const { balanceMinor } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

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
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="text-ink sm:hidden"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <NavLink to="/" className="flex items-center gap-1.5 font-display text-lg tracking-wide text-primary">
            LUCKY
            <PartyMascot size={20} />
          </NavLink>
          <div className="hidden gap-5 sm:flex">
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
          <Link
            to="/wallet"
            title="Wallet"
            className="flex items-center gap-1.5 text-primary transition-opacity hover:opacity-80"
          >
            <WalletIcon size={16} />
            <AnimatedBalance
              balanceMinor={balanceMinor}
              className="font-display text-sm tabular-nums text-ink"
            />
          </Link>
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

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </div>
  )
}

export default App
