import { AnimatePresence, motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// BottomTabBar already covers Draw/Leaderboard/Wallet/Profile — this
// drawer is for everything else: pages reachable from any screen, not
// just via in-page buttons on Draw itself (Recent Entries, Winners,
// Comments all otherwise require being on Draw first).
const links = [
  { to: '/draw/recent', label: 'Recent Entries', end: false },
  { to: '/draw/winners', label: 'Winners', end: false },
  { to: '/draw/comments', label: 'Comments', end: false },
  { to: '/how-to-play', label: 'How to Play', end: false },
]

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const items = user?.role === 'ADMIN' ? [...links, { to: '/admin', label: 'Admin', end: false }] : links

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            // pb- extra: this drawer spans the full height, so its own
            // bottom edge is exactly where the iPhone home-indicator's
            // safe area sits — without it the last nav link would end up
            // flush against (or under) the gesture bar. No-op anywhere
            // without a safe-area concept.
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 bg-ground-raised p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <span className="mb-6 font-display text-lg tracking-wide text-primary">
              LUCKY YOU
            </span>
            {items.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm tracking-wide transition-colors ${
                    isActive ? 'bg-ground text-primary' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
