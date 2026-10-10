import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'

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

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
  }, [supported])

  const enable = useCallback(async () => {
    if (!supported) return false
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const { publicKey } = await apiFetch('/api/push/vapid-public-key')
      if (!publicKey) return false

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

  return { supported, permission, subscribed, loading, enable, disable }
}
