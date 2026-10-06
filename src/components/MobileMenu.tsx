import { AnimatePresence, motion } from 'motion/react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Draw', end: true },
  { to: '/wallet', label: 'Wallet', end: false },
  { to: '/leaderboard', label: 'Leaderboard', end: false },
  { to: '/profile', label: 'Profile', end: false },
]

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 bg-ground-raised p-5 shadow-xl sm:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <span className="mb-6 font-display text-lg tracking-wide text-primary">
              LUCKY
            </span>
            {links.map((link) => (
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
