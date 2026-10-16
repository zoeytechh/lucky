import { MailIcon, WhatsAppIcon } from '../components/Icons'

const SUPPORT_EMAIL = 'chibuzoremkalam@gmail.com'
// wa.me needs the number in full international format with no leading
// zero or punctuation — 0907... (local) becomes 234907... (still Nigeria's
// own country code, just without the "0" that's only meaningful locally).
const SUPPORT_WHATSAPP_DIGITS = '2349074639302'
const SUPPORT_WHATSAPP_DISPLAY = '0907 463 9302'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-sm uppercase tracking-wide text-primary">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="card-raised-sm rounded-lg bg-ground-raised px-4 py-3">
      <p className="font-display text-xs uppercase tracking-wide text-ink">{q}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  )
}

export default function Support() {
  return (
    <main className="mx-auto max-w-sm px-5 py-8 lg:max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Support</h1>
      <p className="mt-1 text-xs text-ink-muted">
        Stuck on something, or found a bug? Reach out directly — a real person reads these.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="card-raised flex items-center gap-3 rounded-xl bg-ground-raised px-4 py-3.5 transition-colors hover:bg-ground-raised-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink">
            <MailIcon size={18} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-sm text-primary">Email</span>
            <span className="text-xs text-ink-muted">{SUPPORT_EMAIL}</span>
          </span>
        </a>
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP_DIGITS}`}
          target="_blank"
          rel="noreferrer"
          className="card-raised flex items-center gap-3 rounded-xl bg-ground-raised px-4 py-3.5 transition-colors hover:bg-ground-raised-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink">
            <WhatsAppIcon size={18} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-sm text-primary">WhatsApp</span>
            <span className="text-xs text-ink-muted">{SUPPORT_WHATSAPP_DISPLAY}</span>
          </span>
        </a>
      </div>

      <Section title="Frequently asked">
        <FaqItem q="How does a draw round work?">
          Every entry costs the same fixed fee. A round fills with a set number of entries, and the
          instant the last slot is taken, one cryptographically-secure shuffle decides the winner,
          the refunds, and the losses all at once — see How to Play for the full breakdown.
        </FaqItem>
        <FaqItem q="How do I fund my wallet or withdraw?">
          Wallet funding (bank transfer or card) and withdrawals to your bank account are on the
          way and not live yet — your Wallet page will show the option the moment they are.
        </FaqItem>
        <FaqItem q="I forgot my device PIN">
          Tap "Forgot PIN?" on the PIN screen. That signs you out and clears the PIN, so you're back
          to a normal phone-number + OTP login — set a fresh PIN right after.
        </FaqItem>
        <FaqItem q="A draw entry or transaction looks wrong">
          Email or WhatsApp us with your phone number and roughly when it happened — every entry
          and wallet transaction is logged permanently on our side, so we can look up exactly what
          happened.
        </FaqItem>
      </Section>
    </main>
  )
}
