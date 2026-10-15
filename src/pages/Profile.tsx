import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChangePinDialog from '../components/ChangePinDialog'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../lib/AuthContext'
import { hasPinSet } from '../lib/pinLock'
import { usePushNotifications } from '../lib/usePushNotifications'
import { isStandalone } from '../lib/standalone'

export default function Profile() {
  const { user, uploadAvatar, updateProfile, logout, logoutAll } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const push = usePushNotifications()
  const [changingPin, setChangingPin] = useState(false)

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

      {/* Shown even when the Push API itself isn't available yet — iOS
          restricts it to an installed PWA (see usePushNotifications'
          needsInstallForPush), and an iOS user who hasn't installed
          should still see this feature exists and how to get it, the
          same way an Android user always can, rather than the whole
          section just silently not being there. */}
      {(push.supported || push.needsInstallForPush) && (
        <div className="card-raised mt-6 flex items-center justify-between gap-3 rounded-lg border border-hairline bg-ground-raised px-4 py-3">
          <div>
            <span className="block text-sm text-ink">Push notifications</span>
            <span className="block text-xs text-ink-muted">
              {push.needsInstallForPush
                ? 'Install Lucky You to your home screen to enable this'
                : push.permission === 'denied'
                  ? 'Blocked in your browser settings'
                  : push.subscribed
                    ? 'A winner is picked or a round is almost full'
                    : 'Get notified even when the app is closed'}
            </span>
          </div>
          {!push.needsInstallForPush && push.permission !== 'denied' && (
            <button
              type="button"
              onClick={() => (push.subscribed ? push.disable() : push.enable())}
              disabled={push.loading}
              className={`shrink-0 rounded-full px-4 py-2 font-display text-xs disabled:opacity-60 ${
                push.subscribed ? 'bg-ground-raised-2 text-ink' : 'bg-primary text-primary-ink'
              }`}
            >
              {push.loading ? '…' : push.subscribed ? 'ON' : 'ENABLE'}
            </button>
          )}
        </div>
      )}
      <AnimatePresence>
        {push.error && (
          <div className="mt-2">
            <ErrorAlert error={push.error} />
          </div>
        )}
      </AnimatePresence>

      {/* PIN setup is mandatory before App.tsx ever lets a standalone
          session reach this page (see usePinLock), so in practice this
          is always set by the time anyone's here — hasPinSet() is just
          the one honest source of truth rather than assuming that. */}
      {isStandalone() && hasPinSet() && (
        <div className="card-raised mt-6 flex items-center justify-between gap-3 rounded-lg border border-hairline bg-ground-raised px-4 py-3">
          <div>
            <span className="block text-sm text-ink">App lock PIN</span>
            <span className="block text-xs text-ink-muted">Required every time you open the app</span>
          </div>
          <button
            type="button"
            onClick={() => setChangingPin(true)}
            className="shrink-0 rounded-full bg-ground-raised-2 px-4 py-2 font-display text-xs text-ink"
          >
            CHANGE
          </button>
        </div>
      )}

      <AnimatePresence>
        {changingPin && <ChangePinDialog onClose={() => setChangingPin(false)} />}
      </AnimatePresence>

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

      {/* Low-stakes to the account itself (no data loss), but consequential
          enough to every other active session that an accidental tap
          shouldn't trigger it outright — a plain confirm is proportionate
          here rather than a full custom dialog. */}
      <button
        type="button"
        onClick={async () => {
          if (!window.confirm('Log out of every device signed into this account?')) return
          await logoutAll()
          navigate('/login', { replace: true })
        }}
        className="mt-2 w-full text-center text-xs text-ink-muted underline"
      >
        Log out of all devices
      </button>
    </main>
  )
}
