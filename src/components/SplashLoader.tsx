import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Loader from './Loader'
import PartyMascot from './PartyMascot'

// Cycles through a real summary of the app — not just the draw mechanic —
// since this screen can sit on a visitor's very first paint for a while
// (a cold Render instance waking up, or just normal network latency
// before the auth check resolves). Leads with what Lucky *is*, then
// touches each core feature in turn, so someone who never gets past this
// screen on a slow connection still walks away knowing what the app does.
const FACTS = [
  'Lucky — a real-money raffle. Enter, win, get paid instantly.',
  '₦1,200 gets you in — one winner takes ₦500,000.',
  'Half the round gets their full stake refunded.',
  'Fund your wallet by bank transfer or card — cash out anytime.',
  'Watch the draw live — everyone sees the winner the moment it settles.',
  'Top spenders each day win a bonus on the leaderboard.',
  'Jump into the live comment feed while you wait.',
]

const ROTATE_MS = 2800

export default function SplashLoader() {
  const [factIndex, setFactIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFactIndex((i) => (i + 1) % FACTS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6">
      <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
        LUCKY
        <PartyMascot size={28} />
      </div>

      <Loader size="lg" />

      <div className="h-10 max-w-xs text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={factIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-xs leading-relaxed text-ink-muted"
          >
            {FACTS[factIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
