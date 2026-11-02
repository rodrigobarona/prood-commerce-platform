import { CheckIcon } from "@phosphor-icons/react/dist/ssr"

import { TileEdge, TileField } from "@prood/ui/components/tile"
import { MultibancoSample } from "@/components/marketing/samples"
import { Container, Eyebrow } from "@/components/marketing/section"
import { paymentProviders } from "@/lib/payment-providers"

/** The true cost of a sale, one tap from the slip: Easypay quotes by proposal, the others list their prices. */
export function ProviderPricing() {
  return (
    <>
      {paymentProviders.map((provider, index) => (
        <span key={provider.id}>
          {index > 0 ? ". " : null}
          <a href={provider.pricingUrl} className="underline underline-offset-2">
            {provider.pricingAction}
          </a>
        </span>
      ))}
      .
    </>
  )
}

const checkoutMethods = [
  { name: "Multibanco", detail: "Pay by reference", picked: true },
  { name: "MB WAY", detail: "Pay on your phone", picked: false },
  { name: "Card", detail: "Visa, Mastercard", picked: false },
] as const

/**
 * The sale from the shopper's side: the methods in one checkout, and the Multibanco
 * slip hanging across the seam. It's the same €63.00 as the hero's receipt.
 */
export function Payments() {
  return (
    <section aria-labelledby="payments-title">
      <div className="surface-ink relative z-10 pt-20 pb-10 md:pt-32 lg:pb-6">
        <TileField size={56} className="text-foreground/[0.04] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
        <Container className="relative grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <Eyebrow>Payments</Eyebrow>
            <h2 id="payments-title" className="mt-4 text-display-md">
              Multibanco and MB&nbsp;WAY, next to cards.
            </h2>
          </div>
          <p className="text-lead text-muted-foreground lg:pb-1">
            Easypay and Ifthenpay put Multibanco, MB WAY and cards in one checkout. Stripe covers cards and wallets. Each
            store&apos;s checkout runs on one provider, and Stripe comes first if it&apos;s connected.
          </p>
        </Container>
        <Container className="relative mt-12 md:mt-16">
          <figure className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              <ul className="border-t border-border">
                {checkoutMethods.map((method) => (
                  <li key={method.name} className="flex items-center gap-4 border-b border-border py-4 md:py-5">
                    <h3 className="text-display-sm">{method.name}</h3>
                    {method.picked ? <CheckIcon weight="bold" className="size-5 text-brand" aria-label="Picked in this sample" /> : null}
                    <p className="ml-auto text-right text-sm text-muted-foreground">{method.detail}</p>
                  </li>
                ))}
              </ul>
              <figcaption className="mt-3 text-xs text-muted-foreground">Sample checkout on Easypay, with sample data.</figcaption>
            </div>
            <MultibancoSample className="-mb-32 ml-auto rotate-1 lg:mr-6 lg:mb-0 lg:max-w-96 lg:translate-y-32" />
          </figure>
        </Container>
      </div>
      <div className="relative flow-root pb-20 md:pb-32">
        <TileEdge className="absolute inset-x-0 top-0 text-ink" />
        <Container className="relative pt-40 lg:pt-44">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <p>
              <span className="block text-display-md">Paid straight to you.</span>
              <span className="mt-3 block max-w-md text-lead text-muted-foreground">
                Prood doesn&apos;t hold your money. Payouts go from your provider to you, on your provider&apos;s schedule.
              </span>
            </p>
            <ul className="border-t border-border">
              {paymentProviders.map((provider) => (
                <li key={provider.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-4">
                  <h3 className="font-sans text-base font-semibold">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.methods}</p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-14 max-w-3xl text-lead lg:mt-20">
            Built for Europe. Plans are priced in euros, and your store&apos;s database and servers run in Frankfurt,
            Germany.
          </p>
        </Container>
      </div>
    </section>
  )
}
