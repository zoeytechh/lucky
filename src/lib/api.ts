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

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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
    throw new ApiError(body.message ?? `Request failed: ${res.status}`, res.status, body.code)
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
