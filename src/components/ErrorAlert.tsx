import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { AlertTriangleIcon, ClockIcon, SignalOffIcon, WalletIcon } from './icons'
import type { ApiError } from '../lib/api'

type Variant = {
  icon: React.ComponentType<{ size?: number }>
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
