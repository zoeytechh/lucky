import PulsingLoader from './PulsingLoader'

const SIZES = {
  sm: { mascotSize: 16, showWord: false, wordSize: undefined },
  md: { mascotSize: 22, showWord: true, wordSize: 9 },
  lg: { mascotSize: 32, showWord: true, wordSize: 13 },
} as const

/**
 * The in-app "something's happening" indicator — for an action request
 * in flight (a button press, a pagination click), not a page's own
 * initial data load (that's Skeleton, shaped like the content that's
 * coming) and not app boot/reload (that's SplashLoader) — same pulsing-
 * mascot design as both, just sized for sitting inside a smaller space
 * like a dialog or card.
 */
export default function Loader({
  size = 'md',
  label,
}: {
  size?: keyof typeof SIZES
  label?: string
}) {
  const { mascotSize, showWord, wordSize } = SIZES[size]
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <PulsingLoader mascotSize={mascotSize} showWord={showWord} wordSize={wordSize} />
      {label && (
        <span className="font-body text-[10px] uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
    </div>
  )
}
