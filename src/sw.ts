/// <reference lib="webworker" />
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// injectManifest (not generateSW) is what this file requires — needed
// specifically so this SW can carry its own push/notificationclick
// handlers, which generateSW's fully-auto-generated worker has no hook
// for. self.__WB_MANIFEST is replaced at build time with the real
// precache list by vite-plugin-pwa's injectManifest build step.
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)

// Same behavior as the old generateSW config's navigateFallbackDenylist
// — every navigation falls back to the cached app shell EXCEPT API
// routes, which must always hit the real server (balances, draw state,
// auth — nothing here is safe to ever serve stale/offline).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api/],
  }),
)

// vite-plugin-pwa's own client code (virtual:pwa-register) sends this
// message to move a waiting worker into activation — required for
// injectManifest mode, where (unlike generateSW) nothing wires this up
// automatically. Without it, UpdatePrompt's Refresh button would send a
// skip-waiting message into the void.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

type PushPayload = { title: string; body: string; url?: string }

const SUPPRESSED_TAG = 'lucky-you-in-app'

self.addEventListener('push', (event) => {
  let payload: PushPayload = { title: 'Lucky You', body: '' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    // A push with no JSON body (or malformed) still shows something
    // rather than silently doing nothing.
  }
  event.waitUntil(
    (async () => {
      // If the app is already open and visible right now, that same
      // live page is already showing this via its own in-app toast (see
      // DrawSocketContext) — a system popup on top would just be a
      // redundant interruption, which the user explicitly asked not to
      // get. Chrome still requires actually calling showNotification()
      // for every push, though, on pain of eventually revoking the
      // permission for ones that go "silent" — so this shows it and
      // closes it again immediately after, rather than skipping the
      // call outright: spec-compliant, and over before anyone notices.
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const appVisible = clients.some((c) => (c as WindowClient).visibilityState === 'visible')

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: payload.url ?? '/' },
        tag: appVisible ? SUPPRESSED_TAG : undefined,
      })

      if (appVisible) {
        const shown = await self.registration.getNotifications({ tag: SUPPRESSED_TAG })
        for (const n of shown) n.close()
      }
    })(),
  )
})

// Focuses an already-open tab and navigates it there if one exists,
// rather than always opening a new one — a user tapping a notification
// almost always means "take me to the app", not "open another copy".
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          if ('navigate' in client) await (client as WindowClient).navigate(url)
          return (client as WindowClient).focus()
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})
