// True when the app is running installed/added-to-home-screen, not just
// open in a regular browser tab — iOS has no standard way to detect this
// (no display-mode support historically), hence the `navigator.standalone`
// fallback; everywhere else, the display-mode media query is authoritative.
export function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}
