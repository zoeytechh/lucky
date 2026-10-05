import { Link, Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <nav className="flex gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
        <Link to="/" className="font-semibold">
          Lucky
        </Link>
        <Link to="/wallet">Wallet</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>
      <Outlet />
    </div>
  )
}

export default App
