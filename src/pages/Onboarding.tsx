import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Onboarding() {
  const { status, user, uploadAvatar } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Guard clauses after every hook call — see the note in Login.tsx.
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'authenticated' && (user?.role !== 'USER' || user.avatarUrl)) {
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
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      await uploadAvatar(file)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
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
          Add a profile photo — real faces keep the draw fair for everyone.
        </p>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mx-auto mt-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-hairline bg-ground-raised"
        >
          {preview ? (
            <img src={preview} alt="Your selected profile" className="h-full w-full object-cover" />
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

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || busy}
          className="mt-6 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
        >
          {busy ? 'UPLOADING…' : 'CONTINUE'}
        </button>
      </div>
    </main>
  )
}
