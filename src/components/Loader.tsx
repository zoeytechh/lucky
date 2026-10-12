import PartyMascot from './PartyMascot'

const SIZES = { sm: 20, md: 36, lg: 56 } as const

/**
 * The in-app "something's happening" indicator — for an action request
 * in flight (a button press, a pagination click), not a page's own
 * initial data load (that's Skeleton, shaped like the content that's
 * coming). Reuses the nav's own dancing mascot rather than a generic
 * spinner, same figure, just always in its energetic `dance` mode here.
 */
export default function Loader({
  size = 'md',
  label,
}: {
  size?: keyof typeof SIZES
  label?: string
}) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <PartyMascot size={SIZES[size]} dance />
      {label && (
        <span className="font-body text-[10px] uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
    </div>
  )
}
