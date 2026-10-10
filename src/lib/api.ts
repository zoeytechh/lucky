export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

// Needed by useCommentSocket — the /comments namespace authenticates at
// the socket handshake (socket.handshake.auth.token), not via a header,
// so it needs to read the same token apiFetch already carries.
export function getAccessToken(): string | null {
  return accessToken
}

// Carries an already-valid access token across a reload the app itself
// triggers (the update-available banner) — see UpdatePrompt.tsx and
// AuthContext's boot effect. Needed because the normal session-restore
// path (POST /api/auth/refresh, relying on the cross-site httpOnly
// cookie) has been observed to fail specifically on iOS PWAs right after
// this kind of reload, dropping an otherwise-mid-session user back to
// the login screen. sessionStorage, not localStorage: this is a one-shot
// handoff for the very next load, not something that should ever survive
// past it or leak into a different tab/session.
const RELOAD_TOKEN_KEY = 'lucky_reload_access_token'

export function stashAccessTokenForReload() {
  if (accessToken) sessionStorage.setItem(RELOAD_TOKEN_KEY, accessToken)
}

export function takeStashedAccessToken(): string | null {
  const token = sessionStorage.getItem(RELOAD_TOKEN_KEY)
  if (token) sessionStorage.removeItem(RELOAD_TOKEN_KEY)
  return token
}

/**
 * Carries a machine-readable `code` alongside the human message, so UI
 * can render tailored copy/icon/actions per error type (see ErrorAlert)
 * instead of just dumping whatever string the server happened to send.
 * `code: 'NETWORK_ERROR'` is synthesized here for a fetch that never
 * reached the server at all — a different situation for the user than a
 * request the server actively rejected, and worth telling apart.
 */
export class ApiError extends Error {
  status: number
  code?: string
  // Set only by OTP_RATE_LIMIT today — the server's authoritative
  // remaining wait, so a countdown can stay accurate regardless of
  // which client action triggered the 429 (not every caller has its own
  // optimistic countdown already running).
  retryAfterSeconds?: number

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

// Thin fetch wrapper. Auth routes/token-refresh logic lands alongside the
// backend auth implementation (build-order step 1/2) — this is the shared
// shape every later feature (draw, wallet, leaderboard) will call through.
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  // Leave FormData bodies alone — the browser sets the multipart boundary.
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include', // sends the refresh-token cookie
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.message ?? `Request failed: ${res.status}`, res.status, body.code, body.retryAfterSeconds)
  }

  return res.json()
}

// The refresh endpoint rotates the token on every call (old one revoked,
// new one issued), so two concurrent callers racing for it is a real bug,
// not just a dev-mode StrictMode artifact: the second call always loses
// against the first's rotation. Every caller shares one in-flight request
// instead of each firing its own.
let refreshInFlight: Promise<{ accessToken: string }> | null = null

export function refreshSession(): Promise<{ accessToken: string }> {
  if (!refreshInFlight) {
    refreshInFlight = apiFetch('/api/auth/refresh', { method: 'POST' }).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/**
 * The full session-restore sequence AuthContext runs on every boot: use a
 * stashed token if one's there (see stashAccessTokenForReload above),
 * otherwise fall back to the cookie-based refresh — then confirm whoever
 * that is via /api/auth/me. Wrapped in the same shared-in-flight pattern
 * as refreshSession, for the same reason: React StrictMode double-invokes
 * effects in dev, and a second, independent call here would find the
 * stash already consumed by the first and fall all the way through to a
 * refresh call that can race or fail — concretely, this surfaced as the
 * second call's own catch clearing the access token the first call had
 * just set, while status stayed 'authenticated', leaving the app stuck
 * re-fetching everything with no token. One shared call means a second
 * caller just gets the first one's own result instead of redoing it.
 */
let restoreInFlight: Promise<{ accessToken: string; user: unknown }> | null = null

export function restoreSession(): Promise<{ accessToken: string; user: unknown }> {
  if (!restoreInFlight) {
    restoreInFlight = (async () => {
      const stashed = takeStashedAccessToken()
      if (stashed) {
        setAccessToken(stashed)
        try {
          const { user } = await apiFetch('/api/auth/me')
          return { accessToken: stashed, user }
        } catch {
          setAccessToken(null)
          // stashed token turned out to be no good — fall through below
        }
      }
      const { accessToken } = await refreshSession()
      setAccessToken(accessToken)
      const { user } = await apiFetch('/api/auth/me')
      return { accessToken, user }
    })().finally(() => {
      restoreInFlight = null
    })
  }
  return restoreInFlight
}
