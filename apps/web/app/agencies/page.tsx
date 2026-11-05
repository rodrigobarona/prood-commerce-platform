import { Button } from "@prood/ui/components/button"
import { TileField } from "@prood/ui/components/tile"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { ClientLedger } from "@/components/marketing/samples"
import { Eyebrow, PageHero, Photo, Section, SectionHeading, StockNote } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { contactHref, docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.agencies)

const isolation = [
  {
    title: "Separate data",
    body: "Each client store is its own organization, with its own catalog, orders and customer records.",
  },
  {
    title: "Their payment accounts",
    body: "Connect the client's own Stripe, Easypay or Ifthenpay account. Each store's credentials are stored separately, encrypted, and only used to talk to their provider.",
  },
  {
    title: "Their domain",
    body: `Build on a ${siteConfig.storeDomain} address, then switch to the client's domain when they sign off. HTTPS is set up for you.`,
  },
  {
    title: "Logins",
    body: "Free has one seat, the owner, so you run the store from your login. Team invites start on Grow, and then nobody shares a password.",
  },
] as const

const steps = [
  { title: "Add the store", body: "One store per client, from Add store in the store switcher, live on a prood.app address straight away." },
  { title: "Set it up", body: "Add products and connect the client's payment account." },
  { title: "Switch to their domain", body: "Point the client's domain at Prood. We provision it and turn on HTTPS." },
  { title: "Keep running it", body: "Run the store for your client through the dashboard or the API. Changing a store by API starts on Grow, and paid plans can't be bought yet." },
] as const

export default function AgenciesPage() {
  return (
    <>
      <PageHero
        eyebrow="For agencies"
        title={["One login.", "Every client store."]}
        lead="Checkout, admin and the Multibanco and MB WAY connections are already built, so a new client store starts at the catalog. Every client gets their own data, payment accounts and domain."
        image="shopfront-ladder"
        position="50% 40%"
        positionMobile="50% 40%"
        inset
        stock
        object={<ClientLedger className="w-[17rem] rotate-1 sm:w-80" />}
      >
        <Button variant="paper" size="hero" asChild>
          <a href={contactHref("Client stores")}>Email us about your client stores</a>
        </Button>
        <Button variant="on-photo" size="hero" asChild>
          <a href={docsPage("guides/for-agencies")}>Read the agency guide</a>
        </Button>
      </PageHero>

      <Section labelledBy="isolation-title" className="pt-16 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
          <div className="flex flex-col">
            <Photo
              slug="team-workshop"
              sizes="(min-width: 1024px) 67vw, 130vw"
              position="45% 50%"
              className="aspect-[4/3] lg:aspect-auto lg:flex-1"
            />
            <StockNote className="mt-3" />
          </div>
          <div>
            <Eyebrow>Isolation</Eyebrow>
            <h2 id="isolation-title" className="mt-4 text-display-md">
              Every client in their own space.
            </h2>
            <p className="mt-6 text-lead text-muted-foreground">
              Each client store has its own catalog, orders, customer records, API keys and payment accounts.
            </p>
            <dl className="mt-10 border-b border-border">
              {isolation.map(({ title, body }) => (
                <div key={title} className="border-t border-border py-4">
                  <dt className="font-medium">{title}</dt>
                  <dd className="mt-1 leading-7 text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 leading-7 text-muted-foreground">
              <span className="font-medium text-foreground">Fits today:</span> small catalogs of goods that post well, at our
              fixed shipping rates. <span className="font-medium text-foreground">Not built yet:</span> photo upload, your own
              shipping rates, VAT and invoices. Stores can&apos;t be exported or passed to a new owner yet, so a store stays
              with the account that created it.
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

      <ClosingCta
        title="Start with one client store."
        body="Set it up on Free and show it to the client on a prood.app address. Running several client stores? Email us, and we'll work out the rest with you."
        emailHref={contactHref("Several client stores")}
        slip={{
          heading: "Per client store",
          lines: [
            { label: "Catalog and orders", value: "Separate" },
            { label: "Customer records", value: "Separate" },
            { label: "API keys", value: "Separate" },
            { label: "Payment accounts", value: "The client's", total: true, highlight: true },
          ],
        }}
      />
    </>
  )
}
