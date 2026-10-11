import { AnimatePresence } from 'motion/react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import CommentReplyToast from '../components/CommentReplyToast'
import { type Comment, type PostResult, useCommentSocket } from './useCommentSocket'

type CommentSocketState = {
  incoming: Comment | null
  expiredIds: string[] | null
  post: (body: string, replyToId?: string) => Promise<PostResult>
}

const CommentSocketContext = createContext<CommentSocketState | null>(null)

/**
 * Owns the one app-wide /comments connection — mounted once in App.tsx
 * above the routed Outlet, same reasoning as DrawSocketProvider: a reply
 * notification has to reach whoever it's for no matter which page
 * they're actually on, not just while CommentFeed itself happens to be
 * mounted. CommentFeed consumes comment:new/expiry through this instead
 * of opening its own second connection to the same namespace.
 */
export function CommentSocketProvider({ children }: { children: ReactNode }) {
  const { incoming, expiredIds, replyNotification, post } = useCommentSocket()
  const [toast, setToast] = useState<Comment | null>(null)

  useEffect(() => {
    if (replyNotification) setToast(replyNotification)
  }, [replyNotification])

  return (
    <CommentSocketContext.Provider value={{ incoming, expiredIds, post }}>
      {children}

      <AnimatePresence>
        {toast && (
          <CommentReplyToast
            displayName={toast.user.displayName}
            body={toast.body}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </CommentSocketContext.Provider>
  )
}

export function useCommentSocketContext() {
  const ctx = useContext(CommentSocketContext)
  if (!ctx) throw new Error('useCommentSocketContext must be used within CommentSocketProvider')
  return ctx
}
