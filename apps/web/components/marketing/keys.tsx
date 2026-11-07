import { TileField } from "@prood/ui/components/tile"
import { cn } from "@prood/ui/lib/utils"
import { HungKey, KeyTag } from "@/components/marketing/key-tag"
import { Eyebrow, Section } from "@/components/marketing/section"

const keys = [
  {
    title: "Your domain",
    body: "Stores run on your own domain, or on a prood.app address until you have one. HTTPS is set up for you.",
    stamp: "For example: loja.casalume.example",
    drop: "5rem",
  },
  {
    title: "Your payment accounts",
    body: "Your Stripe, Easypay or Ifthenpay account. Each store's credentials are stored separately, encrypted, and only used to talk to your provider. Payouts go straight from your provider to you.",
    stamp: "Payouts: direct to you",
    drop: "6.25rem",
  },
  {
    title: "Your API keys",
    body: "Organization keys for your own code. You make them, you name them and you revoke them.",
    stamp: "Revoke any time",
    drop: "5.25rem",
  },
  {
    title: "The final say",
    body: "With Agent Auth, an AI agent starts with nothing until you approve it for your store. After that it keeps the public catalog, and anything else needs your approval.",
    stamp: "Coming with Grow",
    drop: "6.75rem",
  },
] as const

/** The key board behind the counter: four keys on a rail, each one a thing that stays yours. */
export function Keys() {
  return (
    <Section labelledBy="keys-title" className="pt-0 md:pt-0">
      <div className="grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <Eyebrow>Keep the keys</Eyebrow>
          <h2 id="keys-title" className="mt-4 text-display-md">
            Four things that stay in your hands.
          </h2>
        </div>
        <p className="max-w-md text-lead text-muted-foreground lg:pb-1">
          Your domain and payment accounts stay yours if you leave, and you can download your store&apos;s data whenever you like.
        </p>
      </div>
      <div className="surface-ink relative mt-12 overflow-hidden rounded-3xl pb-10 md:mt-16 md:pb-16">
        <TileField size={56} className="text-foreground/[0.04] [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
        <ul
          tabIndex={0}
          aria-label="Four things that stay yours. Scroll sideways on a small screen."
          className="relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4"
        >
          {keys.map((key, index) => (
            <li key={key.title} className="group relative w-[19rem] shrink-0 snap-center px-5 sm:w-auto sm:px-6 xl:px-4">
              {/* One rail runs the width of the board, and each key hangs from its own nail on it. */}
              <div aria-hidden className="absolute inset-x-0 top-5 h-1.5 bg-paper/20" />
              <span aria-hidden className="absolute top-[1.125rem] left-1/2 z-30 size-2.5 -translate-x-1/2 rounded-full bg-paper" />
              <HungKey
                drop={key.drop}
                className={cn(
                  "mx-auto mt-6 max-w-80 origin-top transition-transform duration-200 ease-standard group-hover:rotate-0",
                  index % 2 === 0 ? "-rotate-[0.75deg]" : "rotate-[0.75deg]"
                )}
              >
                <KeyTag>
                  <p aria-hidden className="font-mono text-xs text-ink/65 tabular-nums">
                    Nº {index + 1}
                  </p>
                  <h3 className="mt-1 font-heading text-[1.625rem] leading-[1.14] font-medium tracking-[-0.006em]">{key.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-6 text-ink/75">{key.body}</p>
                  <p className="mt-5 border-t border-dashed border-ink/30 pt-3 font-mono text-xs text-ink">{key.stamp}</p>
                </KeyTag>
              </HungKey>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
