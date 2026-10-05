const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

// Thin fetch wrapper. Auth routes/token-refresh logic lands alongside the
// backend auth implementation (build-order step 1/2) — this is the shared
// shape every later feature (draw, wallet, leaderboard) will call through.
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include', // sends the refresh-token cookie
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `Request failed: ${res.status}`)
  }

  return res.json()
}
