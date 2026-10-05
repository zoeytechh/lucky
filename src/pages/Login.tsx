// Phone + OTP sign-in. Wired up once the auth backend (build-order step 1)
// has /api/auth/otp/request and /api/auth/otp/verify live.
export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Log in
        </h1>
        <p className="mt-2 text-neutral-500">
          Phone + OTP sign-in goes here.
        </p>
      </div>
    </main>
  )
}
