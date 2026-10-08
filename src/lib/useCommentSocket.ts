import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL, getAccessToken } from './api'

export type Comment = {
  id: string
  body: string
  createdAt: string
  user: { id: string; displayName: string }
}

export type PostResult = { ok: true } | { ok: false; code: string; message: string }

/**
 * The /comments namespace is authenticated (unlike the default namespace
 * used for round progress/settlement) — posting needs a real user
 * identity. `auth` is passed as a function, not a static object, so a
 * reconnect (e.g. after the access token rotates) re-reads the current
 * token instead of replaying whatever was valid at the first connection.
 */
export function useCommentSocket() {
  const [incoming, setIncoming] = useState<Comment | null>(null)
  const [expiredIds, setExpiredIds] = useState<string[] | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(`${API_URL}/comments`, {
      auth: (cb) => cb({ token: getAccessToken() }),
    })
    socketRef.current = socket
    socket.on('comment:new', (comment: Comment) => setIncoming(comment))
    // The server's 24h expiry job just deleted these — see
    // jobs/commentExpiry.ts. A new array reference each time, so a
    // second expiry batch later in the session still triggers the
    // effect that watches it.
    socket.on('comment:expired', ({ ids }: { ids: string[] }) => setExpiredIds(ids))
    return () => {
      socket.disconnect()
    }
  }, [])

  function post(body: string): Promise<PostResult> {
    return new Promise((resolve) => {
      const socket = socketRef.current
      if (!socket) {
        resolve({ ok: false, code: 'ERROR', message: 'Not connected' })
        return
      }
      socket.emit('comment:send', body, (res: PostResult) => resolve(res))
    })
  }

  return { incoming, expiredIds, post }
}
