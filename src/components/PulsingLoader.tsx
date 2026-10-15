import PartyMascot from './PartyMascot'

/**
 * The app loader's visual core — the mascot breathing with a soft gold
 * ripple expanding behind it, no ring. Replaces the earlier spinning
 * color-cycling ring (kept the ring's .loader-word styling for the
 * optional wordmark, dropped everything ring-specific) after comparing
 * several loader directions and picking this one. Shared by Loader
 * (in-flight actions, icon-only) and SplashLoader (app boot/reload,
 * with the wordmark) — one design, sized and labeled differently.
 */
export default function PulsingLoader({
  mascotSize,
  showWord = true,
  wordSize,
}: {
  mascotSize: number
  showWord?: boolean
  wordSize?: number
}) {
  const rippleSize = mascotSize * 2.6
  return (
    <div className="loader-pulse-stack">
      <div className="loader-pulse-wrap" style={{ width: rippleSize, height: rippleSize }}>
        <span className="loader-pulse-ripple" />
        <span className="loader-pulse-ripple loader-pulse-ripple--delayed" />
        <PartyMascot size={mascotSize} pulse />
      </div>
      {showWord && (
        <span className="loader-word" style={{ fontSize: wordSize }}>
          LUCKY YOU
        </span>
      )}
    </div>
  )
}
