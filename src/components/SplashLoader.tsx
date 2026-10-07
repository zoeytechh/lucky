import Loader from './Loader'
import PartyMascot from './PartyMascot'

/**
 * Shown while the auth check is in flight — on a first visit, and on
 * every page reload for an already-logged-in user (status briefly goes
 * back to 'loading' until the silent refresh resolves). Deliberately
 * just the spinner and mascot, not the app-flow step list: that list
 * belongs to LoginIntro's one-time "about to log in" moment, not to a
 * transient reload a logged-in user hits randomly — showing it here
 * read as the onboarding screen resurfacing on every refresh.
 */
export default function SplashLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6">
      <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
        LUCKY
        <PartyMascot size={28} />
      </div>

      <Loader size="lg" />
    </div>
  )
}
