import { motion } from 'motion/react'

// The actual flow a new user goes through, in order — shared by
// SplashLoader (shown while a cold Render instance wakes up / the auth
// check resolves) and the login screen's intro (shown before a first-time
// or session-expired visitor sees the phone/OTP form), so the two don't
// drift into two different descriptions of the same app.
const STEPS = [
  'Fund your wallet — bank transfer or card',
  'Enter the draw — ₦1,200',
  'Round fills, the winner is picked live',
  'Win ₦500,000, get refunded, or try again',
  'Cash out to your bank anytime',
]

export default function AppFlowSteps() {
  return (
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
  )
}
