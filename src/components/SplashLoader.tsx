import LoaderRing from './LoaderRing'

/**
 * Shown while the auth check is in flight — on a first visit, and on
 * every page reload for an already-logged-in user (status briefly goes
 * back to 'loading' until the silent refresh resolves), including the
 * explicit reload UpdatePrompt's Refresh button triggers. Same ring
 * design as Loader (in-flight actions), just at its largest size —
 * one loader, used everywhere a spinner rather than a content skeleton
 * is the right cue, not two different visual languages for "app is
 * starting" versus "an action is in flight."
 */
export default function SplashLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <LoaderRing diameter={140} ringWidth={12} mascotSize={32} wordSize={14} />
    </div>
  )
}
