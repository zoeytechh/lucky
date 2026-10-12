/**
 * A single pulsing placeholder block — shape it to whatever the real
 * content will be (a line of text, a circle, a row) via className, not
 * via props, so every call site stays a one-liner instead of needing
 * its own width/height/shape API. Used instead of a generic spinner on
 * every page that's genuinely waiting on backend data, so the layout
 * the real content will take is visible from the first paint instead of
 * jumping into existence once the fetch resolves.
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ground-raised-2 ${className}`} />
}
