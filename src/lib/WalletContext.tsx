import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch } from './api'
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
