import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { isStandalone } from '../lib/standalone'
import { IosShareIcon } from './Icons'

const DISMISS_KEY = 'lucky:ios-install-dismissed'

// iOS Safari has no equivalent of Chrome's beforeinstallprompt — there is
// no native "install this app" prompt at all, just the manual
// Share → Add to Home Screen flow. This banner is the only way to
// surface that path inside the app instead of expecting users to
// already know it exists.
function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua)
  return isIos && isSafari
}

export default function IosInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || !isIosSafari()) return
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {
      // Private browsing can throw on localStorage access — fail open
      // and just show the banner rather than crash.
    }
    setVisible(true)
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          // bottom offset adds the iPhone home-indicator's safe-area inset
          // on top of the usual 1rem — index.html's viewport-fit=cover
          // already lets content extend under it, so without this the
          // banner would sit flush against (or under) the gesture bar.
          // env() resolves to 0 on anything without a safe-area concept
          // (Android, desktop), so this is a no-op there.
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-primary/30 bg-ground-raised px-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink">
            <IosShareIcon size={18} />
          </span>
          <p className="flex-1 text-xs leading-snug text-ink">
            Install Lucky You: tap <span className="text-primary">Share</span>, then{' '}
            <span className="text-primary">Add to Home Screen</span>.
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 text-base leading-none text-ink-muted"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
