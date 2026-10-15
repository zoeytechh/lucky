import PulsingLoader from './PulsingLoader'

/**
 * Shown while the auth check is in flight — on a first visit, and on
 * every page reload for an already-logged-in user (status briefly goes
 * back to 'loading' until the silent refresh resolves), including the
 * explicit reload UpdatePrompt's Refresh button triggers. Same pulsing-
 * mascot design as Loader (in-flight actions), just at its largest size —
 * one loader, used everywhere a spinner rather than a content skeleton
 * is the right cue, not two different visual languages for "app is
 * starting" versus "an action is in flight."
 */
export default function SplashLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ground px-6">
      <PulsingLoader mascotSize={36} wordSize={14} />
    </div>
  )
}
