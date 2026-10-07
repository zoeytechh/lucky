import { motion } from 'motion/react'
import Loader from './Loader'
import PartyMascot from './PartyMascot'

// The actual flow a new user goes through, in order — shown as a real
// list rather than one swapping line, since "how does this app work"
// is a sequence, not a set of interchangeable facts. Sits on screen for
// however long the first paint takes (a cold Render instance waking up,
// or just normal network latency before the auth check resolves).
const STEPS = [
  'Fund your wallet — bank transfer or card',
  'Enter the draw — ₦1,200',
  'Round fills, the winner is picked live',
  'Win ₦500,000, get refunded, or try again',
  'Cash out to your bank anytime',
]

export default function SplashLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6">
      <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
        LUCKY
        <PartyMascot size={28} />
      </div>

      <Loader size="lg" />

      <ol className="flex w-full max-w-xs flex-col gap-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 * i }}
            className="flex items-center gap-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs text-primary-ink">
              {i + 1}
            </span>
            <span className="text-sm font-bold leading-snug text-ink">{step}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
