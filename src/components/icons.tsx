// Small inline icon set shared across the app — consistent stroke-based
// style (matches HamburgerIcon in App.tsx), no icon library dependency.

export function WalletIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function SignalOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 2l14 14M4 10.5a8 8 0 0 1 3-2M8 7.3a8 8 0 0 1 6 2.2M6.5 13a3 3 0 0 1 3.3-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="15.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function ClockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function AlertTriangleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 2.5 16.5 15h-15L9 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 7.5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="13" r="0.9" fill="currentColor" />
    </svg>
  )
}
