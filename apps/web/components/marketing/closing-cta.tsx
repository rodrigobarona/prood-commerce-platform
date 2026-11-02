import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { Receipt, type ReceiptLine } from "@prood/ui/components/receipt"
import { TileEdge, TileField } from "@prood/ui/components/tile"
import { Container } from "@/components/marketing/section"
import { siteConfig } from "@/lib/site"

type Slip = { heading: string; meta?: string; lines: ReceiptLine[]; footer?: React.ReactNode }

const whatYouKeep: Slip = {
  heading: "What you keep",
  lines: [
    { label: "Your domain", value: "Yours" },
    { label: "Payment accounts", value: "Yours" },
    { label: "API keys", value: "Yours" },
    { label: "Payouts", value: "Direct to you", total: true, highlight: true },
  ],
}

/** The page's last word, on a slip made out for whoever is reading this page. */
export function ClosingCta({
  title = "Open your store today.",
  body = "Add products, connect your payment account and point your domain. Free for 50 products and 100 orders a month.",
  slip = whatYouKeep,
  emailHref = `mailto:${siteConfig.email}`,
}: {
  title?: string
  body?: string
  slip?: Slip
  emailHref?: string
}) {
  return (
    <section aria-labelledby="cta-title" className="surface-telha relative overflow-hidden">
      <TileField size={64} className="text-paper/[0.05] [mask-image:linear-gradient(to_top,transparent_5rem,black_8rem)]" />
      <TileEdge className="absolute inset-x-0 top-0 text-(--closing-edge,var(--page))" />
      <Container className="relative grid items-start gap-x-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="py-24 md:py-36">
          <h2 id="cta-title" className="max-w-4xl text-display-lg">
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-lead">{body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button variant="paper" size="hero" asChild>
              <a href={siteConfig.registerUrl}>
                Start free
                <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button variant="on-photo" size="hero" asChild>
              <a href={emailHref}>Email us</a>
            </Button>
          </div>
        </div>
        <Receipt
          className="mb-16 max-w-72 -rotate-1 lg:mt-24 lg:mb-0 lg:max-w-80"
          heading={slip.heading}
          meta={slip.meta}
          lines={slip.lines}
          footer={slip.footer}
        />
      </Container>
    </section>
  )
}
