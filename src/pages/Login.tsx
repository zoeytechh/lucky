// Phone + OTP sign-in. Wired up once the auth backend (build-order step 1)
// has /api/auth/otp/request and /api/auth/otp/verify live.
export default function Login() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <span className="font-display text-2xl text-primary">LUCKY</span>
        <p className="mt-2 text-sm text-ink-muted">
          Enter your phone number to get a code.
        </p>

        <input
          type="tel"
          placeholder="080X XXX XXXX"
          className="mt-6 w-full rounded-lg border border-hairline bg-ground-raised px-4 py-3 text-center text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
        />

        <button
          type="button"
          className="mt-4 w-full rounded-full bg-primary py-3 font-display text-sm text-primary-ink"
        >
          SEND CODE
        </button>
      </div>
    </main>
  )
}
