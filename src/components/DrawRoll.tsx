import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  capacity: number
  entered: number
  /** The viewer's own slot number in the round currently being shown, if they have one. */
  mySlotNumber: number | null
  /** Set once the round has settled — switches from "rolling" to "reveal". */
  winnerSlotNumber: number | null
}

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 37) % 84), // spread across the width, deterministic not random (stable across re-renders)
  size: 6 + ((i * 13) % 10),
  delay: (i % 7) * 0.22,
  duration: 2.4 + ((i * 7) % 5) * 0.2,
}))

function BubbleParty() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      {BUBBLES.map((b) => (
        <motion.span
          key={b.id}
          className="absolute rounded-full bg-primary/70"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, bottom: 0 }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -160, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Pure ambient flourish, not a claim about live multi-user state — there's
 * no websocket feed of other people's entries yet (that's M10), so the
 * "rolling" numbers are just a cycling animation suggesting the draw is in
 * motion, not a real-time view of other entrants. The one thing that *is*
 * real: if the viewer has their own entry in this round, their actual
 * slotNumber is woven into the cycle and held/highlighted when it comes up.
 */
export default function DrawRoll({ capacity, entered, mySlotNumber, winnerSlotNumber }: Props) {
  const [displayed, setDisplayed] = useState(mySlotNumber ?? 1)
  const [isMine, setIsMine] = useState(false)
  const holdUntil = useRef(0)

  useEffect(() => {
    if (winnerSlotNumber !== null) return // stop rolling once settled

    const tick = () => {
      if (Date.now() < holdUntil.current) return // mid-hold on the viewer's own number

      let next = 1 + Math.floor(Math.random() * capacity)
      // Weight toward landing on the viewer's own number occasionally so
      // it's not a rare blink-and-you-miss-it moment.
      if (mySlotNumber !== null && Math.random() < 0.18) next = mySlotNumber

      setDisplayed(next)
      const mine = next === mySlotNumber
      setIsMine(mine)
      if (mine) holdUntil.current = Date.now() + 500
    }

    const id = setInterval(tick, 130)
    return () => clearInterval(id)
  }, [capacity, mySlotNumber, winnerSlotNumber])

  const settled = winnerSlotNumber !== null
  const pct = Math.min(100, (entered / capacity) * 100)
  const youWon = settled && mySlotNumber !== null && mySlotNumber === winnerSlotNumber

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 148,
        height: 148,
        background: settled
          ? 'conic-gradient(var(--color-primary) 0% 100%, var(--color-primary) 100%)'
          : `conic-gradient(var(--color-primary) 0% ${pct}%, rgba(244,239,222,0.14) ${pct}% 100%)`,
      }}
    >
      {settled && <BubbleParty />}
      <div className="relative flex h-[114px] w-[114px] flex-col items-center justify-center rounded-full bg-ground">
        <AnimatePresence mode="wait">
          {settled ? (
            <motion.div
              key="winner"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="flex flex-col items-center"
            >
              <span
                className={`font-display text-[30px] leading-none tabular-nums ${
                  youWon ? 'text-success' : 'text-primary'
                }`}
              >
                {winnerSlotNumber}
              </span>
              <span className="mt-1.5 text-[10px] tracking-wider text-ink-muted">
                {youWon ? 'YOU WON!' : 'WINNER'}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={displayed}
              initial={{ scale: 0.85, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col items-center"
            >
              <span
                className={`font-display text-[28px] leading-none tabular-nums ${
                  isMine ? 'text-secondary' : 'text-ink'
                }`}
              >
                {displayed}
              </span>
              <span className="mt-1.5 text-[10px] tracking-wider text-ink-muted">
                {isMine ? 'YOUR NUMBER' : `OF ${capacity.toLocaleString()}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
