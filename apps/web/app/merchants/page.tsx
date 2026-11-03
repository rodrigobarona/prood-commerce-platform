import { TileField } from "@prood/ui/components/tile"
import { Button } from "@prood/ui/components/button"
import { Receipt } from "@prood/ui/components/receipt"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { Makers } from "@/components/marketing/makers"
import { Eyebrow, PageHero, Photo, Section, SectionHeading, StockNote } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "For brands and shops",
  description:
    "A storefront, checkout and orders, ready when you sign up. Take Multibanco, MB WAY and cards through your own payment account, on your own domain.",
  path: "/merchants",
})

const included = [
  {
    title: "Your own domain",
    body: `Your store is live on a ${siteConfig.storeDomain} address straight away. Point your own domain at it when you're ready, and we set up HTTPS.`,
  },
  {
    title: "How Portugal pays",
    body: "Multibanco and MB WAY through your Easypay or Ifthenpay account, and cards through Stripe, with Apple Pay and Google Pay where you've turned them on.",
  },
  {
    title: "Paid straight to you",
    body: "Prood doesn't hold your money. Payouts go from your provider to you, on your provider's schedule.",
  },
  {
    title: "One dashboard",
    body: "Products, orders, customers and refunds in one place. Invite your team starting on Grow.",
  },
  {
    title: "Built for Europe",
    body: "Plans are priced in euros, and your store's database and servers run in Frankfurt, Germany.",
  },
] as const

const steps = [
  { title: "Open your store", body: `Start free. Your store is live on a ${siteConfig.storeDomain} address straight away.` },
  { title: "Add your products", body: "Name, price, description and stock, in the dashboard." },
  { title: "Connect your payments", body: "Add your own Stripe, Easypay or Ifthenpay account. Payouts go straight to you." },
  { title: "Switch to your domain", body: "Point your domain at Prood. We provision it and turn on HTTPS." },
] as const

export default function MerchantsPage() {
  return (
    <>
      <PageHero
        eyebrow="For brands and shops"
        title={["Your shop,", "on your own", "domain."]}
        lead="A storefront, checkout and orders, ready when you sign up. Take Multibanco, MB WAY and cards through your own payment account, and get paid straight from your provider."
        image="shop-shelves"
        position="50% 35%"
        positionMobile="60% 35%"
        inset
        stock
        object={
          <Receipt
            className="w-72 origin-bottom-right rotate-1 lg:w-80"
            heading="Order #1042"
            meta="Example"
            lines={[
              { label: "Linen cloth", value: "€24.00" },
              { label: "Paid by", value: "MB WAY" },
              { label: "Payout", value: "Direct to you", total: true, highlight: true },
            ]}
          />
        }
      >
        <Button variant="paper" size="hero" asChild>
          <a href={siteConfig.registerUrl}>Start free</a>
        </Button>
        <Button variant="on-photo" size="hero" asChild>
          <a href={docsPage("guides/for-merchants")}>Read the merchant guide</a>
        </Button>
      </PageHero>

      <Section labelledBy="included-title" className="pt-16 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
          <div className="flex flex-col">
            <Photo
              slug="owner-packing"
              sizes="(min-width: 1024px) 67vw, 130vw"
              position="50% 50%"
              className="aspect-[4/3] lg:aspect-auto lg:flex-1"
            />
            <StockNote className="mt-3" />
          </div>
          <div>
            <Eyebrow>What you get</Eyebrow>
            <h2 id="included-title" className="mt-4 text-display-md">
              The shop is built. You bring the goods.
            </h2>
            <dl className="mt-10 border-b border-border">
              {included.map(({ title, body }) => (
                <div key={title} className="border-t border-border py-4">
                  <dt className="font-medium">{title}</dt>
                  <dd className="mt-1 leading-7 text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 leading-7 text-muted-foreground">
              <span className="font-medium text-foreground">Fits today:</span> small catalogs of goods that post well, at our
              fixed shipping rates. <span className="font-medium text-foreground">Not built yet:</span> photo upload, your own
              shipping rates, VAT and invoices, and your store&apos;s returns, terms and privacy pages.
            </p>
          </div>
        </div>
      </Section>

      <section aria-labelledby="steps-title" className="surface-ink relative overflow-hidden py-20 md:py-28">
        <TileField size={56} className="text-foreground/[0.04] [mask-image:linear-gradient(to_left,black,transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12">
          <SectionHeading id="steps-title" eyebrow="How it works" title="Four steps to a live store." />
          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title}>
                <p aria-hidden className="text-display-md text-brand tabular-nums">
                  {index + 1}
                </p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Makers />

      <ClosingCta title="Open your store for free." />
    </>
  )
}
