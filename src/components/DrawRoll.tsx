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
 * The "rolling" numbers only animate while the round is genuinely full and
 * waiting on the suspense-before-reveal window (see Draw.tsx's
 * round:settled handling) — that's the one phase that's actually "the
 * draw in motion". Earlier this animated unconditionally any time there
 * was no winner yet, including while entries were still being collected,
 * which read as "the draw is happening" when nothing actually was. While
 * entries are still coming in, this shows a static state instead: the
 * viewer's own slot number if they've entered, or just the entry count if
 * they haven't.
 */
export default function DrawRoll({ capacity, entered, mySlotNumber, winnerSlotNumber }: Props) {
  const settled = winnerSlotNumber !== null
  const isDrawing = !settled && entered >= capacity

  const [displayed, setDisplayed] = useState(mySlotNumber ?? 1)
  const [isMine, setIsMine] = useState(false)
  const holdUntil = useRef(0)

  useEffect(() => {
    if (!isDrawing) return

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
  }, [capacity, mySlotNumber, isDrawing])

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
          ) : isDrawing ? (
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
                {isMine ? 'YOUR NUMBER' : 'DRAWING…'}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ scale: 0.85, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col items-center"
            >
              <span
                className={`font-display text-[28px] leading-none tabular-nums ${
                  mySlotNumber !== null ? 'text-secondary' : 'text-ink'
                }`}
              >
                {mySlotNumber ?? entered}
              </span>
              <span className="mt-1.5 text-[10px] tracking-wider text-ink-muted">
                {mySlotNumber !== null ? 'YOUR NUMBER' : `OF ${capacity.toLocaleString()}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
