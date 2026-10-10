import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { stashAccessTokenForReload } from '../lib/api'

/**
 * Surfaces exactly the gap that's been causing confusion after every
 * deploy so far: the PWA's service worker can keep serving an old cached
 * bundle with no visible sign anything's stale, so a shipped fix can
 * look "not there" to someone who already had the app open. This makes
 * that state visible and gives a one-tap way out of it, instead of
 * silently reloading (registerType: 'prompt' in vite.config.ts) or
 * leaving the viewer to guess that a hard refresh might help.
 */
// How often to ask the browser to re-fetch sw.js and compare it against
// what's installed, while the app stays open with no navigation of its
// own. Without this, the only thing that ever triggers that check is a
// real page navigation (a reload, or leaving and coming back) — which is
// exactly the gap that made this banner only ever show up late.
const UPDATE_CHECK_INTERVAL_MS = 60_000

export default function UpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, reg) {
      if (!reg) return
      setRegistration(reg)
      setInterval(() => {
        reg.update()
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })
  const [refreshing, setRefreshing] = useState(false)

  // The interval above is the baseline, but a backgrounded/minimized tab
  // has its timers throttled or fully paused by the browser — exactly
  // the case that matters most here (someone reopening an app they left
  // running for a while), so the interval alone can miss it for a long
  // stretch. This catches up the moment the tab actually becomes visible
  // or regains focus again, instead of waiting on a throttled timer or a
  // full navigation to trigger the check.
  useEffect(() => {
    if (!registration) return
    function checkNow() {
      if (document.visibilityState === 'visible') registration!.update()
    }
    document.addEventListener('visibilitychange', checkNow)
    window.addEventListener('focus', checkNow)
    return () => {
      document.removeEventListener('visibilitychange', checkNow)
      window.removeEventListener('focus', checkNow)
    }
  }, [registration])

  // Two real bugs stacked here, found by actually simulating a deploy
  // and clicking the button rather than trusting the library's types:
  //
  // 1. updateServiceWorker's `reloadPage` param has been a no-op since
  //    vite-plugin-pwa 0.13.2 (its own type definition says so) — it
  //    only activates the new worker and leaves reloading to the
  //    caller, so passing `true` alone did nothing visible.
  //
  // 2. Awaiting updateServiceWorker() and then calling reload()
  //    *immediately* still isn't enough — that promise resolves right
  //    after the skip-waiting message is *sent*, not after the browser
  //    actually finishes handing control to the new worker. Reloading
  //    that fast is a real race: confirmed by rebuilding the app,
  //    clicking Refresh, and inspecting the navigation response — it
  //    came back `fromServiceWorker: true` serving the *old* precache,
  //    even though the new worker's own cache already had the new one.
  //    A `fetch()` to the same URL a moment later correctly got the new
  //    content, proving the new worker does take over — just not
  //    synchronously with updateServiceWorker()'s promise. Waiting for
  //    the real `controllerchange` event before reloading closes that
  //    gap; a timeout is a fallback only, in case it never fires.
  async function handleRefresh() {
    setRefreshing(true)
    // Carries the current, still-valid session across this reload — see
    // api.ts's stashAccessTokenForReload for why: the normal cookie-based
    // silent refresh has been seen to fail specifically on iOS right
    // after this exact reload, which was dropping an otherwise mid-
    // session user back to the login screen instead of just refreshing.
    stashAccessTokenForReload()
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 3000)
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
      updateServiceWorker(true)
    })
    window.location.reload()
  }

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
            A new version of Lucky You is ready.
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 rounded-full bg-primary px-4 py-2 font-display text-xs text-primary-ink disabled:opacity-60"
          >
            {refreshing ? 'REFRESHING…' : 'REFRESH'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
