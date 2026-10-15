import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'
import { isIos, isStandalone } from './standalone'

// The Push API's applicationServerKey wants raw bytes, not the base64url
// string the server hands back — standard boilerplate, there's no DOM
// API that does this conversion for you.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/**
 * Background push notifications (round settled, round almost full —
 * see lucky-api's push.service.ts) require explicit opt-in: a real
 * permission prompt, then a PushManager subscription registered against
 * this browser's service worker (src/sw.ts carries the actual push/
 * notificationclick handlers) and sent to the backend to store. Nothing
 * here is automatic on load — Notification permission prompts that fire
 * unprompted are reliably auto-dismissed/blocked by browsers, so this is
 * only ever triggered by the user tapping an explicit toggle (see
 * Profile.tsx).
 */
export function usePushNotifications() {
  const supported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  // Apple restricts the actual Push API to a PWA that's been added to the
  // home screen — in a regular Safari/Chrome-on-iOS tab, either the API
  // isn't exposed at all (supported comes back false) or it's present but
  // subscribe() itself rejects, depending on the exact iOS version; this
  // app doesn't try to tell those two apart, it just always knows *why*
  // push isn't available on iOS outside standalone, so the UI can say so
  // instead of either silently hiding the feature (an iOS user would never
  // know it exists at all, unlike Android) or showing a button that fails
  // with no explanation.
  const needsInstallForPush = isIos() && !isStandalone()

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
  }, [supported])

  // Returns rather than throws on failure — this used to be fire-and-
  // forget from Profile.tsx's onClick (no .catch(), no await), so any
  // rejection here (most commonly subscribe() itself rejecting on iOS
  // outside standalone) became a silent unhandled rejection: the button
  // just... did nothing, with zero explanation. Now every failure path
  // sets `error` before resolving, so the caller always has something to
  // show instead of a button that mysteriously reverts.
  const enable = useCallback(async () => {
    if (!supported) return false
    setLoading(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const { publicKey } = await apiFetch('/api/push/vapid-public-key')
      if (!publicKey) {
        setError(new Error('Push notifications are not configured yet'))
        return false
      }

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }
      const json = sub.toJSON()
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setSubscribed(true)
      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Could not enable notifications on this device'),
      )
      return false
    } finally {
      setLoading(false)
    }
  }, [supported])

  const disable = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await apiFetch('/api/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint }),
        }).catch(() => {})
      }
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [supported])

  return { supported, needsInstallForPush, permission, subscribed, loading, error, enable, disable }
}
