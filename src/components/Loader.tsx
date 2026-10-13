import LoaderRing from './LoaderRing'

const SIZES = {
  sm: { diameter: 40, ringWidth: 4, mascotSize: 16, showWord: false, wordSize: undefined },
  md: { diameter: 80, ringWidth: 7, mascotSize: 20, showWord: true, wordSize: 9 },
  lg: { diameter: 128, ringWidth: 11, mascotSize: 30, showWord: true, wordSize: 13 },
} as const

/**
 * The in-app "something's happening" indicator — for an action request
 * in flight (a button press, a pagination click), not a page's own
 * initial data load (that's Skeleton, shaped like the content that's
 * coming) and not app boot/reload (that's SplashLoader) — same ring
 * design as both, just sized for sitting inside a smaller space like a
 * dialog or card.
 */
export default function Loader({
  size = 'md',
  label,
}: {
  size?: keyof typeof SIZES
  label?: string
}) {
  const { diameter, ringWidth, mascotSize, showWord, wordSize } = SIZES[size]
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <LoaderRing
        diameter={diameter}
        ringWidth={ringWidth}
        mascotSize={mascotSize}
        showWord={showWord}
        wordSize={wordSize}
      />
      {label && (
        <span className="font-body text-[10px] uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
    </div>
  )
}
