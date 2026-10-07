import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../lib/AuthContext'

export default function Profile() {
  const { user, uploadAvatar, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError(null)
    setSavingPhoto(true)
    try {
      await uploadAvatar(file)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Upload failed'))
    } finally {
      setSavingPhoto(false)
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavingName(true)
    try {
      await updateProfile(fullName)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Could not save'))
    } finally {
      setSavingName(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Profile</h1>

      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={savingPhoto}
          className="h-24 w-24 overflow-hidden rounded-full border border-hairline bg-ground-raised disabled:opacity-60"
        >
          {(preview ?? user?.avatarUrl) && (
            <img
              src={preview ?? user?.avatarUrl ?? undefined}
              alt="Your profile"
              className="h-full w-full object-cover"
            />
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePick}
          className="hidden"
        />
        <span className="mt-2 text-xs text-ink-muted">
          {savingPhoto ? 'Uploading…' : 'Tap photo to change it'}
        </span>
      </div>

      <form onSubmit={handleSaveName} className="mt-8">
        <label htmlFor="fullName" className="block text-[11px] uppercase tracking-wider text-ink-muted">
          Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />

        <label className="mt-5 block text-[11px] uppercase tracking-wider text-ink-muted">
          Phone
        </label>
        <div className="mt-2 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-ink-muted">
          {user?.phoneNumber}
        </div>

        <AnimatePresence>
          {error && (
            <div className="mt-3">
              <ErrorAlert error={error} />
            </div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={savingName || !fullName.trim()}
          className="mt-5 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink disabled:opacity-60"
        >
          {savingName ? 'SAVING…' : saved ? 'SAVED' : 'SAVE'}
        </button>
      </form>

      <button
        type="button"
        onClick={async () => {
          await logout()
          navigate('/login', { replace: true })
        }}
        className="mt-8 w-full text-center text-xs text-ink-muted underline"
      >
        Log out
      </button>
    </main>
  )
}
