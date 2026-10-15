// True when the app is running installed/added-to-home-screen, not just
// open in a regular browser tab — iOS has no standard way to detect this
// (no display-mode support historically), hence the `navigator.standalone`
// fallback; everywhere else, the display-mode media query is authoritative.
export function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

// True on any iOS browser, not just Safari — every browser on iOS is a
// wrapper around the same WebKit engine (an App Store rule, not a Safari-
// specific quirk), so Apple's iOS-only platform restrictions (Web Push
// requiring standalone mode being the one this exists for) apply equally
// to Chrome/Firefox-on-iOS as to Safari itself.
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}
