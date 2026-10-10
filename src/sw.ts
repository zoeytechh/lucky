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

self.addEventListener('push', (event) => {
  let payload: PushPayload = { title: 'Lucky You', body: '' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    // A push with no JSON body (or malformed) still shows something
    // rather than silently doing nothing — Chrome requires showing a
    // notification for every push event it delivers, on pain of
    // eventually revoking the permission for "silent" pushes.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.url ?? '/' },
    }),
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
