import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 70
const MAX_PULL = 110
// How long the spinner stays visible after a refresh fires — there's no
// promise to await here (onRefresh just remounts the current page, see
// App.tsx), so this is a fixed, generous-enough window for that remount
// and its data fetch to visibly settle, not a real completion signal.
const REFRESHING_DISPLAY_MS = 700

// iOS-only: installed Android Chrome/WebAPK still offers its own native
// pull-to-refresh in standalone mode, so a custom one there only doubles
// up / conflicts with it. iOS Safari's "Add to Home Screen" standalone
// mode is the one case with no native gesture at all.
function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

/**
 * An installed iOS app has no native pull-to-refresh — Safari only
 * offers that gesture inside an actual browser tab, which is why it
 * works in-browser but silently does nothing once added to the home
 * screen. This recreates the gesture, but only on iOS standalone; a
 * regular browser tab (any platform) and installed Android both already
 * have a working native gesture, so this stays completely inert there.
 *
 * Deliberately does NOT call window.location.reload() — a full reload
 * on iOS standalone was observed dropping the user back to the login
 * screen (the in-memory access token and the httpOnly refresh cookie
 * both need to survive the reload and clearly don't reliably in that
 * context). `onRefresh` instead remounts just the routed page content
 * (see App.tsx's refreshKey), which re-runs every page's own data
 * fetch without ever touching auth state or navigating anywhere.
 */
export default function PullToRefresh({ onRefresh }: { onRefresh: () => void }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullRef = useRef(0)
  const active = useRef(isIos() && isStandalone())

  useEffect(() => {
    if (!active.current) return

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || window.scrollY > 0) return
      const delta = e.touches[0].clientY - startY.current
      const next = delta > 0 ? Math.min(delta, MAX_PULL) : 0
      pullRef.current = next
      setPull(next)
    }
    function onTouchEnd() {
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true)
        onRefresh()
        setTimeout(() => setRefreshing(false), REFRESHING_DISPLAY_MS)
      }
      setPull(0)
      startY.current = null
      pullRef.current = 0
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!active.current) return null

  const shown = pull > 0 || refreshing

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
      style={{ transform: `translateY(${shown ? 16 + Math.min(pull, THRESHOLD) * 0.4 : -100}px)` }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-ink shadow-[0_6px_16px_-4px_rgba(0,0,0,0.4)]">
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          animate={refreshing ? { rotate: 360 } : { rotate: pull * 2.4 }}
          transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
        >
          <path d="M13 3a6 6 0 1 1-2-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M13 1v3h-3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
    </div>
  )
}
