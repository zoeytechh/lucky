import AppFlowSteps from './AppFlowSteps'
import PartyMascot from './PartyMascot'

/**
 * Shown before the phone/OTP form itself — every time someone lands on
 * /login unauthenticated, whether that's a genuine first-time visitor or
 * a returning one whose session expired and needs to OTP in again (both
 * are "about to log in with no context on screen", so both see it). No
 * loading icon here, unlike SplashLoader — this isn't waiting on
 * anything, it's a deliberate screen the viewer reads, then continues
 * past.
 */
export default function LoginIntro({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
          LUCKY YOU
          <PartyMascot size={28} />
        </div>
        <p className="max-w-70 font-body text-base font-extrabold leading-snug text-ink">
          Stand a chance to win <span className="text-primary">₦500,000</span> with just{' '}
          <span className="text-primary">₦1,000</span>
        </p>
      </div>

      <AppFlowSteps />

      <button
        type="button"
        onClick={onContinue}
        className="mt-2 w-full max-w-xs rounded-full bg-primary py-3 font-display text-sm text-primary-ink"
      >
        LET'S GO
      </button>
    </div>
  )
}
