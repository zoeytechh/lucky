import { motion } from 'motion/react'

/**
 * A small animated figure celebrating, in the gold primary color —
 * decorative only, lives next to the LUCKY wordmark in the nav. Ties
 * into the "Owambe" (Nigerian party) framing the whole visual identity
 * is built around, rather than a generic spinner/loader shape. Loops a
 * gentle bounce + sway continuously (CSS-driven via Motion's `animate`,
 * not triggered by any app state) — "automatic movement", not a reaction
 * to anything.
 */
export default function PartyMascot({ size = 22, dance = false }: { size?: number; dance?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-primary"
      animate={
        // A bigger, faster version of the same loop for the winner
        // celebration — the nav's own gentle sway would read as too
        // subdued for "someone just won real money."
        dance
          ? { y: [0, -9, 0, -5, 0], rotate: [-22, 22, -16, 16, 0], scale: [1, 1.1, 1, 1.06, 1] }
          : { y: [0, -3, 0], rotate: [-6, 6, -6] }
      }
      transition={{ duration: dance ? 0.85 : 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="11" cy="4.6" r="2.1" fill="currentColor" />
      <path
        d="M11 7.2v5.3M11 9.5 6.8 5.8M11 9.5l4.2-3.7M11 12.5 7 18M11 12.5l4 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </motion.svg>
  )
}
