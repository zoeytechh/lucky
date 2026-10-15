// A device-level app lock, independent of the real login session — the
// JWT/refresh-cookie pair already proves who's logged in; this answers a
// different question ("is whoever's holding this specific device right
// now actually allowed to use it"), the same way a bank or messaging
// app's own PIN/biometric lock sits on top of, not instead of, its real
// auth. Never sent to the server — stored only as a salted hash on this
// device, so it's unrecoverable by anyone but whoever set it, including
// Lucky You itself.
const PIN_STORAGE_KEY = 'lucky:pin-lock'

// Session-scoped, deliberately separate from the hash above: survives a
// reload within the same tab/PWA process (so the PIN isn't re-asked on
// every reload — see usePinLock.ts), but disappears the moment the OS
// actually ends that process, same as the rest of sessionStorage.
const UNLOCKED_FLAG_KEY = 'lucky:pin-unlocked'

export function readUnlockedFlag(): boolean {
  try {
    return sessionStorage.getItem(UNLOCKED_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function writeUnlockedFlag(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(UNLOCKED_FLAG_KEY, '1')
    else sessionStorage.removeItem(UNLOCKED_FLAG_KEY)
  } catch {}
}

type StoredPin = { saltHex: string; hashHex: string }

function bufferToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  return bytes
}

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const pinBytes = new TextEncoder().encode(pin)
  const combined = new Uint8Array(salt.length + pinBytes.length)
  combined.set(salt)
  combined.set(pinBytes, salt.length)
  const digest = await crypto.subtle.digest('SHA-256', combined)
  return bufferToHex(digest)
}

export function hasPinSet(): boolean {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) !== null
  } catch {
    // Private browsing can throw on storage access — fail to "no PIN set"
    // rather than crash; the app just won't offer the lock on this device.
    return false
  }
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hashHex = await hashPin(pin, salt)
  const stored: StoredPin = { saltHex: bufferToHex(salt), hashHex }
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(stored))
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(PIN_STORAGE_KEY)
  if (!raw) return false
  try {
    const stored: StoredPin = JSON.parse(raw)
    const hashHex = await hashPin(pin, hexToBytes(stored.saltHex))
    return hashHex === stored.hashHex
  } catch {
    return false
  }
}

export function clearPin(): void {
  try {
    localStorage.removeItem(PIN_STORAGE_KEY)
  } catch {}
  // A forgotten PIN invalidates any already-unlocked session too — there's
  // no reason the device should stay "unlocked" against a PIN that was
  // just wiped.
  writeUnlockedFlag(false)
}
