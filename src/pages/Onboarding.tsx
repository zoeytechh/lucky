import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../lib/AuthContext'

export default function Onboarding() {
  const { status, user, uploadAvatar, updateProfile } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [busy, setBusy] = useState(false)

  // A real name is as mandatory as the photo — both exist for the same
  // accountability reason, and a winner reveal or a public feed falling
  // back to a masked phone number reads as anonymous for a real-money
  // product. Checked together here so this page's own "done" condition
  // never drifts from the backend's requireCompleteProfile.
  const profileComplete = (u: typeof user) => Boolean(u?.avatarUrl && u?.fullName)

  // Guard clauses after every hook call — see the note in Login.tsx.
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'authenticated' && (user?.role !== 'USER' || profileComplete(user))) {
    return <Navigate to="/" replace />
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    if (!picked) return
    setFile(picked)
    setError(null)
    setPreview(URL.createObjectURL(picked))
  }

  async function handleSubmit() {
    const trimmedName = name.trim()
    if ((!file && !user?.avatarUrl) || !trimmedName) return
    setError(null)
    setBusy(true)
    try {
      if (file) await uploadAvatar(file)
      await updateProfile(trimmedName)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Could not save your profile'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <span className="font-display text-xl uppercase tracking-wide text-ink">
          One last step
        </span>
        <p className="mt-2 text-sm text-ink-muted">
          Add a profile photo and your name. Real identities keep the draw fair for everyone —
          no one sees your phone number, just this.
        </p>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mx-auto mt-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-hairline bg-ground-raised"
        >
          {preview || user?.avatarUrl ? (
            <img
              src={preview ?? user!.avatarUrl!}
              alt="Your selected profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-ink-muted">Tap to choose</span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePick}
          className="hidden"
        />

        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-5 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />

        <AnimatePresence>
          {error && (
            <div className="mt-3">
              <ErrorAlert error={error} />
            </div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!file && !user?.avatarUrl) || !name.trim() || busy}
          className="mt-6 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
        >
          {busy ? 'SAVING…' : 'CONTINUE'}
        </button>
      </div>
    </main>
  )
}
