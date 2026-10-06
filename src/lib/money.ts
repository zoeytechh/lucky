/** Formats a minor-unit (kobo) amount, as returned by the API (a string — JSON can't carry a bigint), as a Naira display string. */
export function formatNaira(amountMinor: string | number | bigint): string {
  const naira = Number(amountMinor) / 100
  const abs = Math.abs(naira)
  const sign = naira < 0 ? '-' : ''
  return `${sign}₦${abs.toLocaleString('en-NG', { maximumFractionDigits: abs % 1 === 0 ? 0 : 2 })}`
}
