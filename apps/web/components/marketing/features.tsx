import { Section, SectionHeading } from "@/components/marketing/section"

const notBuiltYet = [
  {
    title: "Shipping",
    body: "Fixed for now: Standard 15.00 in your currency (5 to 7 days), Express 35.00 (1 to 2 days). Your store shows these to shoppers. Setting your own rates is coming later.",
  },
  { title: "Tax", body: "Prices are what you enter. Prood doesn't calculate VAT or issue invoices yet." },
  { title: "Photo upload, coupons, store export", body: "Coming later." },
  { title: "Your store's returns, terms and privacy pages", body: "Coming later." },
] as const

const demoStore = {
  title: "The demo store",
  body: "It's sample data, and it doesn't take orders. We loaded its photos, categories and sizes directly. The dashboard can't add any of them yet. The API can add categories and sizes, starting on Grow.",
}

const features = [
  { title: "Catalog", body: "Products with prices, descriptions and an in-stock switch." },
  { title: "Hosted checkout", body: "Multibanco and MB WAY. Cards, plus Apple Pay and Google Pay where you've enabled them. Shoppers pay on Prood's checkout page, then return to your store." },
  { title: "Orders", body: "Fulfill, cancel or refund. Refunds run through Stripe and, for MB WAY and cards, Easypay. Others you record in the dashboard." },
  { title: "Custom domains", body: "Add your domain and we provision it, HTTPS included." },
  { title: "Team", body: "Invites start on Grow. Everyone signs in with their own account." },
  ...notBuiltYet,
  demoStore,
] as const

const ROW = "grid gap-1 border-t border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"

/** Every part of a store, for the page where people compare. */
export function StoreSpec() {
  return (
    <Section labelledBy="features-title" className="pt-0 md:pt-0">
      <div className="grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <SectionHeading id="features-title" eyebrow="On every plan" title="The parts a store runs on." />
        <p className="text-lead text-muted-foreground lg:pb-1">
          What every store gets today, and what&apos;s coming later.
        </p>
      </div>
      <dl className="mt-14 grid gap-x-16 border-b border-border lg:grid-cols-2">
        {features.map(({ title, body }) => (
          <div key={title} className={ROW}>
            <dt className="font-medium">{title}</dt>
            <dd className="leading-7 text-muted-foreground">{body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
