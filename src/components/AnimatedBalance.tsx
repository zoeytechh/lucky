import { animate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { formatNaira } from '../lib/money'

/**
 * Counts up (or down) from the previously displayed balance to the new
 * one over ~1.1s instead of snapping straight to it — most noticeable
 * right after a win/refund credit lands, but applies to any balance
 * change so the nav and Wallet page behave consistently.
 */
export default function AnimatedBalance({
  balanceMinor,
  className,
}: {
  balanceMinor: string | null
  className?: string
}) {
  const [display, setDisplay] = useState<number | null>(
    balanceMinor === null ? null : Number(balanceMinor),
  )
  const prevRef = useRef<number | null>(display)

  useEffect(() => {
    if (balanceMinor === null) return
    const target = Number(balanceMinor)
    const from = prevRef.current

    if (from === null || from === target) {
      prevRef.current = target
      setDisplay(target)
      return
    }

    const controls = animate(from, target, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: setDisplay,
    })
    prevRef.current = target
    return () => controls.stop()
  }, [balanceMinor])

  return <span className={className}>{display === null ? '—' : formatNaira(display)}</span>
}
