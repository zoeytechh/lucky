export default function RoundRing({
  entered,
  capacity,
}: {
  entered: number
  capacity: number
}) {
  const pct = Math.min(100, (entered / capacity) * 100)

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 148,
        height: 148,
        background: `conic-gradient(var(--color-primary) 0% ${pct}%, rgba(244,239,222,0.14) ${pct}% 100%)`,
      }}
    >
      <div className="flex h-[114px] w-[114px] flex-col items-center justify-center rounded-full bg-ground">
        <span className="font-display text-[28px] leading-none text-ink tabular-nums">
          {entered}
        </span>
        <span className="mt-1.5 text-[10px] tracking-wider text-ink-muted">
          OF {capacity.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
