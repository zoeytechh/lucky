import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, restoreSession, setAccessToken } from './api'

export type User = {
  id: string
  phoneNumber: string
  fullName: string | null
  avatarUrl: string | null
  role: string
}

type AuthState = {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  user: User | null
  requestOtp: (phoneNumber: string) => Promise<void>
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  updateProfile: (fullName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading')
  const [user, setUser] = useState<User | null>(null)

  // On load, try to restore a session — normally via the httpOnly refresh
  // cookie, or via a token stashed just before an app-triggered reload
  // (see api.ts's restoreSession/stashAccessTokenForReload and
  // UpdatePrompt.tsx) when the cookie-based path has been seen to fail
  // right after that specific reload, notably on iOS. The access token
  // itself is otherwise never persisted client-side.
  useEffect(() => {
    ;(async () => {
      try {
        const { user } = await restoreSession()
        setUser(user as User)
        setStatus('authenticated')
      } catch {
        setAccessToken(null)
        setStatus('unauthenticated')
      }
    })()
  }, [])

  const requestOtp = useCallback(async (phoneNumber: string) => {
    await apiFetch('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    })
  }, [])

  const verifyOtp = useCallback(async (phoneNumber: string, code: string) => {
    const { accessToken, user } = await apiFetch('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    })
    setAccessToken(accessToken)
    setUser(user)
    setStatus('authenticated')
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    const { user } = await apiFetch('/api/profile/avatar', { method: 'POST', body: form })
    setUser(user)
  }, [])

  const updateProfile = useCallback(async (fullName: string) => {
    const { user } = await apiFetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ fullName }),
    })
    setUser(user)
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  return (
    <AuthContext.Provider
      value={{ status, user, requestOtp, verifyOtp, uploadAvatar, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
