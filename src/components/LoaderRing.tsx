import PartyMascot from './PartyMascot'

/**
 * The visual core shared by Loader (in-flight actions) and SplashLoader
 * (app boot/reload) — a spinning, color-cycling ring (see the
 * .loader-ring/.loader-cycle-* rules in index.css) with the mascot and
 * wordmark held steady at its center. Pulled out as its own component
 * since both call sites need the exact same markup, just sized
 * differently.
 */
export default function LoaderRing({
  diameter,
  ringWidth,
  mascotSize,
  showWord = true,
  wordSize,
}: {
  diameter: number
  ringWidth: number
  mascotSize: number
  showWord?: boolean
  wordSize?: number
}) {
  return (
    <div className="loader-stage" style={{ width: diameter, height: diameter }}>
      <div className="loader-ring" />
      <div className="loader-face" style={{ inset: ringWidth, gap: showWord ? 4 : 0 }}>
        <PartyMascot size={mascotSize} />
        {showWord && (
          <span className="loader-word" style={{ fontSize: wordSize }}>
            LUCKY YOU
          </span>
        )}
      </div>
    </div>
  )
}
