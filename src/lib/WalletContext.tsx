import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { io } from 'socket.io-client'
import { API_URL, apiFetch, getAccessToken } from './api'
import { useAuth } from './AuthContext'

type WalletState = {
  balanceMinor: string | null
  loading: boolean
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [balanceMinor, setBalanceMinor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Wallet routes are gated behind a complete profile (see
  // requireCompleteProfile), so fetching is only meaningful once that's
  // true — not just once a session exists. A user becomes 'authenticated'
  // the moment they verify their OTP, before onboarding/avatar upload, so
  // depending on status alone would fetch too early (get a 403, and never
  // retry once the profile actually completes, since status itself
  // doesn't change again). Depending on avatarUrl too re-fires this the
  // moment onboarding finishes.
  const profileComplete = user?.role !== 'USER' || Boolean(user?.avatarUrl)

  const refresh = useCallback(async () => {
    try {
      const { balanceMinor } = await apiFetch('/api/wallet')
      setBalanceMinor(balanceMinor)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && profileComplete) refresh()
  }, [status, profileComplete, refresh])

  // Live push for any balance change not driven by this tab's own
  // actions — an admin/script credit, a future Paystack deposit webhook,
  // a payout landing while this tab is just sitting open elsewhere.
  // `auth` as a function (not a static object), same reasoning as
  // useCommentSocket: a reconnect re-reads whatever token is current
  // rather than replaying one that may have since rotated.
  useEffect(() => {
    if (status !== 'authenticated' || !profileComplete) return
    const socket = io(`${API_URL}/wallet`, {
      auth: (cb) => cb({ token: getAccessToken() }),
    })
    socket.on('wallet:updated', (payload: { balanceMinor: string }) => {
      setBalanceMinor(payload.balanceMinor)
    })
    return () => {
      socket.disconnect()
    }
  }, [status, profileComplete])

  return (
    <WalletContext.Provider value={{ balanceMinor, loading, refresh }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
