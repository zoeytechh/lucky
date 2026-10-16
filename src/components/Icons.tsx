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

export function ChatIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 4h12v8H8l-3 3v-3H3V4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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

// The actual iOS Share-sheet glyph (a box with an arrow leaving its top)
// — used only to point at the real Safari share button, so it needs to
// be recognizable as that specific icon, not a generic "share" symbol.
export function IosShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2v9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5.8 5.2 9 2l3.2 3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 8v6a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TrophyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M6 3h6v4.5a3 3 0 0 1-6 0V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 4H3.5a1 1 0 0 0-1 1v1a2.5 2.5 0 0 0 2.5 2.5H6M12 4h2.5a1 1 0 0 1 1 1v1a2.5 2.5 0 0 1-2.5 2.5H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9 10.5V13M6.5 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function QuestionIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.8 7a2.2 2.2 0 1 1 3.4 1.8c-.6.4-1.2.8-1.2 1.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M6.5 3.5 12 9l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 9.2 8.1 11.3 12.3 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PersonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 15.5a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TicketIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 4 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 1.5 1.5 0 0 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M11 5.5v7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 1.6" />
    </svg>
  )
}

export function SupportIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m4.2 4.2 2.6 2.6M13.8 4.2l-2.6 2.6M4.2 13.8l2.6-2.6M13.8 13.8l-2.6-2.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m2.5 5 6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 2.5a6.5 6.5 0 0 0-5.6 9.8L2.5 15.5l3.3-.9A6.5 6.5 0 1 0 9 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.3 6.1c.2-.4.4-.4.6-.4h.4c.2 0 .4 0 .5.4.2.4.6 1.4.6 1.5.1.1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.2.4.8 1.2 1.6 1.7.6.4.9.5 1.1.4.2-.1.4-.3.6-.5.1-.1.3-.2.5-.1.2.1 1.1.5 1.3.6.2.1.3.2.4.3 0 .2 0 .8-.3 1.1-.3.4-1 .7-1.4.7-.4 0-1.6-.2-3-1.4-1.7-1.4-2.2-3-2.2-3.3 0-.3-.1-.6.2-1.1l.2-.2Z"
        fill="currentColor"
      />
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
