const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** "7 Oct 2026" — used alongside a round number so a list of rounds (recent entries, past winners) is dated without changing how rounds are numbered. */
export function formatRoundDate(iso: string): string {
  return formatter.format(new Date(iso))
}
