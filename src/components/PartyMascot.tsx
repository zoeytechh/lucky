import { motion } from 'motion/react'

/**
 * A small animated figure celebrating, in the gold primary color —
 * decorative only, lives next to the LUCKY wordmark in the nav. Ties
 * into the "Owambe" (Nigerian party) framing the whole visual identity
 * is built around, rather than a generic spinner/loader shape. Loops a
 * gentle bounce + sway continuously (CSS-driven via Motion's `animate`,
 * not triggered by any app state) — "automatic movement", not a reaction
 * to anything.
 *
 * `dance` (WinnerModal only) swaps this single-path figure for one with
 * each limb as its own line, swinging independently and out of phase —
 * arms alternating up/down, legs kicking apart and together — instead of
 * just wobbling the whole body as one rigid unit.
 */
export default function PartyMascot({ size = 22, dance = false }: { size?: number; dance?: boolean }) {
  if (!dance) {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="text-primary"
        animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
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

  const beat = 0.42 // seconds per half-beat — the whole figure's tempo

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-primary"
      animate={{ y: [0, -4, 0], rotate: [-8, 8, -8] }}
      transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.circle
        cx="11"
        r="2.1"
        fill="currentColor"
        animate={{ cy: [4.6, 3.8, 4.6] }}
        transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* spine */}
      <path d="M11 7.2v5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* left arm: shoulder fixed at (11, 9.5), hand swings high-left to low-left */}
      <motion.line
        x1="11"
        y1="9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x2: [6.8, 8.6, 6.4], y2: [5.8, 11, 6.2] }}
        transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* right arm: mirrored, opposite phase — one arm's up while the other's down */}
      <motion.line
        x1="11"
        y1="9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x2: [15.2, 13.4, 15.6], y2: [5.8, 11, 6.2] }}
        transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut', delay: beat }}
      />
      {/* left leg: hip fixed at (11, 12.5), foot kicks out and back in */}
      <motion.line
        x1="11"
        y1="12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x2: [7, 9.5, 6.6], y2: [18, 17.2, 18] }}
        transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut', delay: beat }}
      />
      {/* right leg: mirrored, opposite phase */}
      <motion.line
        x1="11"
        y1="12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x2: [15, 12.5, 15.4], y2: [18, 17.2, 18] }}
        transition={{ duration: beat * 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}
