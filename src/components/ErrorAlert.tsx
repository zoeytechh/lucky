import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { ApiError } from '../lib/api'

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  )
}

function SignalOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

type Variant = {
  icon: () => React.JSX.Element
  title: string
}

const variants: Record<string, Variant> = {
  INSUFFICIENT_BALANCE: { icon: WalletIcon, title: 'Not enough balance' },
  NETWORK_ERROR: { icon: SignalOffIcon, title: 'Connection problem' },
  OTP_EXPIRED: { icon: ClockIcon, title: 'Code expired' },
  OTP_RATE_LIMIT: { icon: ClockIcon, title: 'Too many requests' },
  OTP_TOO_MANY_ATTEMPTS: { icon: ClockIcon, title: 'Too many attempts' },
  OTP_INVALID: { icon: AlertTriangleIcon, title: 'Incorrect code' },
  VALIDATION_ERROR: { icon: AlertTriangleIcon, title: 'Check your input' },
  PROFILE_INCOMPLETE: { icon: AlertTriangleIcon, title: 'Profile incomplete' },
  default: { icon: AlertTriangleIcon, title: 'Something went wrong' },
}

/**
 * Tailored per error code (icon + title), not just a raw message dump —
 * the backend sends a `code` alongside `message` for exactly this (see
 * api.ts's ApiError). Unrecognized/missing codes fall back to a generic
 * but still properly-themed alert, never a bare string.
 */
export default function ErrorAlert({
  error,
  action,
}: {
  error: ApiError | Error | string
  action?: { label: string; to: string }
}) {
  const code = typeof error === 'object' && 'code' in error ? error.code : undefined
  const message = typeof error === 'string' ? error : error.message
  const variant = variants[code ?? 'default'] ?? variants.default
  const Icon = variant.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-left"
    >
      <span className="mt-0.5 shrink-0 text-danger">
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] uppercase tracking-wide text-danger">
          {variant.title}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">{message}</p>
        {action && (
          <Link to={action.to} className="mt-1.5 inline-block text-xs text-primary underline">
            {action.label}
          </Link>
        )}
      </div>
    </motion.div>
  )
}
