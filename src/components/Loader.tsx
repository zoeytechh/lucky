const SIZES = {
  sm: { box: 20, track: 4 },
  md: { box: 36, track: 6 },
  lg: { box: 56, track: 8 },
} as const

export default function Loader({
  size = 'md',
  label,
}: {
  size?: keyof typeof SIZES
  label?: string
}) {
  const { box, track } = SIZES[size]

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="motion-safe:animate-spin rounded-full"
        style={{
          width: box,
          height: box,
          background: `conic-gradient(var(--color-primary) 0% 22%, rgba(244,239,222,0.14) 22% 100%)`,
        }}
      >
        <div
          className="rounded-full bg-ground"
          style={{ margin: track, width: box - track * 2, height: box - track * 2 }}
        />
      </div>
      {label && (
        <span className="font-body text-[10px] uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
    </div>
  )
}
