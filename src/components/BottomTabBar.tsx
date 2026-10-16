import { NavLink } from 'react-router-dom'
import { PersonIcon, TicketIcon, TrophyIcon, WalletIcon } from './Icons'

const tabs = [
  { to: '/', label: 'Draw', end: true, Icon: TicketIcon },
  { to: '/leaderboard', label: 'Top 3', end: false, Icon: TrophyIcon },
  { to: '/wallet', label: 'Wallet', end: false, Icon: WalletIcon },
  { to: '/profile', label: 'Profile', end: false, Icon: PersonIcon },
] as const

/**
 * The mobile-only persistent bottom tab bar (Instagram/Snapchat-style) —
 * one-tap access to the four pages people actually return to constantly,
 * sitting permanently on screen instead of behind the hamburger menu.
 * Everything else (How to Play, Comments, Winners, Admin) stays in
 * MobileMenu — a tab bar this size reads as cluttered past 4-5 icons,
 * so it's deliberately not a replacement for that menu, just a shortcut
 * for the handful of destinations worth one tap instead of two.
 */
export default function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-hairline bg-ground-raised pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Primary"
    >
      {tabs.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${
              isActive ? 'text-primary' : 'text-ink-muted'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
