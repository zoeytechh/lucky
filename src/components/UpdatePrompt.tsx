import { AnimatePresence, motion } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Surfaces exactly the gap that's been causing confusion after every
 * deploy so far: the PWA's service worker can keep serving an old cached
 * bundle with no visible sign anything's stale, so a shipped fix can
 * look "not there" to someone who already had the app open. This makes
 * that state visible and gives a one-tap way out of it, instead of
 * silently reloading (registerType: 'prompt' in vite.config.ts) or
 * leaving the viewer to guess that a hard refresh might help.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-ground-raised-2 px-4 py-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:right-4 sm:max-w-xs"
        >
          <span className="text-xs font-bold leading-snug text-ink">
            A new version of Lucky is ready.
          </span>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-full bg-primary px-4 py-2 font-display text-xs text-primary-ink"
          >
            REFRESH
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
