import PartyMascot from './PartyMascot'

/**
 * Shown while the auth check is in flight — on a first visit, and on
 * every page reload for an already-logged-in user (status briefly goes
 * back to 'loading' until the silent refresh resolves). Deliberately
 * just the wordmark, not the app-flow step list: that list belongs to
 * LoginIntro's one-time "about to log in" moment, not to a transient
 * reload a logged-in user hits randomly — showing it here read as the
 * onboarding screen resurfacing on every refresh. No separate Loader
 * below it — Loader is the same mascot now, so having both on screen
 * at once was just two copies of the same figure; the wordmark's own
 * mascot carries the "something's happening" signal on its own here,
 * sped up from its usual gentle nav pace so it actually reads as
 * "loading" rather than just idle decoration.
 */
export default function SplashLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6">
      <div className="flex items-center gap-2 font-display text-2xl tracking-wide text-primary">
        LUCKY YOU
        <PartyMascot size={28} speed={0.4} />
      </div>
    </div>
  )
}
