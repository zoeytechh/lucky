import { useEffect, useState } from 'react'
import { hasPinSet } from './pinLock'
import { isStandalone } from './standalone'

/**
 * Drives App.tsx's PIN gate. `unlocked` starts false on every mount —
 * which is exactly "locked on cold launch" for free, no separate case to
 * handle — and gets reset back to false the moment the tab is backgrounded
 * (not just on close), so returning to an already-open app re-locks it
 * too. Outside standalone mode (a regular browser tab) the lock doesn't
 * apply at all — `unlocked` starts true and nothing here ever flips it.
 *
 * No explicit reset for the "Forgot PIN" case (PinLockScreen clears the
 * stored PIN and logs out): logging out routes to /login, a genuinely
 * different route element than App, so App fully unmounts rather than
 * staying mounted with stale state — the next time it mounts (after
 * re-authenticating), this hook's initial state recomputes from scratch
 * and correctly finds no PIN set.
 */
export function usePinLock() {
  const standalone = isStandalone()
  const [needsSetup, setNeedsSetup] = useState(() => standalone && !hasPinSet())
  const [unlocked, setUnlocked] = useState(() => !standalone)

  useEffect(() => {
    if (!standalone) return
    function relock() {
      if (document.visibilityState === 'hidden') setUnlocked(false)
    }
    document.addEventListener('visibilitychange', relock)
    return () => document.removeEventListener('visibilitychange', relock)
  }, [standalone])

  return {
    needsSetup,
    unlocked,
    unlock: () => setUnlocked(true),
    markSetupDone: () => {
      setNeedsSetup(false)
      setUnlocked(true)
    },
  }
}
