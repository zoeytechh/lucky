import { useEffect, useRef, useState } from 'react'
import { hasPinSet, readUnlockedFlag, writeUnlockedFlag } from './pinLock'
import { isStandalone } from './standalone'

// How long the app can sit backgrounded before the PIN is required again —
// matches how standard apps (OPay and similar) actually behave: a brief
// switch away (checking a text, copying an OTP) doesn't re-prompt, but
// genuinely stepping away for a while does. Not re-locking on every
// reload/every backgrounding was the explicit complaint this replaced —
// that read as far more aggressive than any real app actually is.
const BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Drives App.tsx's PIN gate. `unlocked` starts true on mount whenever the
 * session flag is already there (a reload, or any other remount within
 * the same still-running process) — only a genuine first mount of a new
 * process (the flag was never set, or the OS actually ended the previous
 * one) starts locked. Outside standalone mode the lock doesn't apply at
 * all — `unlocked` starts true and nothing here ever flips it.
 *
 * Re-locks only after BACKGROUND_TIMEOUT_MS spent actually hidden, not on
 * every backgrounding — tracked via a ref (not state), since recording
 * *when* the tab went hidden has no reason to trigger a render on its own,
 * only the eventual relock decision does.
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
  const [unlocked, setUnlocked] = useState(() => !standalone || readUnlockedFlag())
  const hiddenAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!standalone) return
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        return
      }
      // Back to visible.
      const hiddenAt = hiddenAtRef.current
      hiddenAtRef.current = null
      if (hiddenAt !== null && Date.now() - hiddenAt > BACKGROUND_TIMEOUT_MS) {
        writeUnlockedFlag(false)
        setUnlocked(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [standalone])

  return {
    needsSetup,
    unlocked,
    unlock: () => {
      writeUnlockedFlag(true)
      setUnlocked(true)
    },
    markSetupDone: () => {
      writeUnlockedFlag(true)
      setNeedsSetup(false)
      setUnlocked(true)
    },
  }
}
