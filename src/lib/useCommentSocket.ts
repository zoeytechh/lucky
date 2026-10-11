import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL, getAccessToken } from './api'

export type Comment = {
  id: string
  body: string
  createdAt: string
  user: { id: string; displayName: string }
  replyTo: { id: string; body: string; user: { id: string; displayName: string } } | null
}

export type PostResult = { ok: true } | { ok: false; code: string; message: string }

/**
 * The /comments namespace is authenticated (unlike the default namespace
 * used for round progress/settlement) — posting needs a real user
 * identity. `auth` is passed as a function, not a static object, so a
 * reconnect (e.g. after the access token rotates) re-reads the current
 * token instead of replaying whatever was valid at the first connection.
 *
 * Mounted once at the app level (see CommentSocketContext), not inside
 * CommentFeed itself — a reply notification has to reach someone
 * wherever they are in the app, the same reasoning DrawSocketContext
 * already applies to winner announcements. Scoping this connection to
 * CommentFeed's own mount lifecycle would mean it only existed while
 * actually looking at the Draw page.
 */
export function useCommentSocket() {
  const [incoming, setIncoming] = useState<Comment | null>(null)
  const [expiredIds, setExpiredIds] = useState<string[] | null>(null)
  const [replyNotification, setReplyNotification] = useState<Comment | null>(null)
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
    // Private — only ever received by the person actually being replied
    // to (the server targets this socket's own userId room), never
    // broadcast like comment:new.
    socket.on('comment:replied', (comment: Comment) => setReplyNotification(comment))
    return () => {
      socket.disconnect()
    }
  }, [])

  function post(body: string, replyToId?: string): Promise<PostResult> {
    return new Promise((resolve) => {
      const socket = socketRef.current
      if (!socket) {
        resolve({ ok: false, code: 'ERROR', message: 'Not connected' })
        return
      }
      socket.emit('comment:send', { body, replyToId }, (res: PostResult) => resolve(res))
    })
  }

  return { incoming, expiredIds, replyNotification, post }
}
