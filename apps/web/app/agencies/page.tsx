import {
  CreditCardIcon,
  DatabaseIcon,
  GlobeSimpleIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/dist/ssr"

import { getMarketingTier } from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { contactHref, docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "For agencies",
  description:
    "Build and run client stores on Prood. Each client gets isolated data, their own payment accounts and their own domain, all from one login.",
  path: "/agencies",
})

const isolation = [
  {
    icon: DatabaseIcon,
    title: "Separate data",
    body: "Each client is its own organization, with its own catalog, orders and customers.",
  },
  {
    icon: CreditCardIcon,
    title: "Their payment accounts",
    body: "Connect the client's own Stripe, Easypay or Ifthenpay account. Credentials are encrypted per store.",
  },
  {
    icon: GlobeSimpleIcon,
    title: "Their domain",
    body: `Build on client.${siteConfig.storeDomain}, then switch to the client's domain when they sign off. HTTPS is set up for you.`,
  },
  {
    icon: UserPlusIcon,
    title: "Their own logins",
    body: "Invite the client's team by email. Nobody shares a password, and you keep your access.",
  },
] as const

const steps = [
  { title: "Create the store", body: "One organization per client, live on a prood.app address straight away." },
  { title: "Set it up", body: "Add products, connect the client's payment account and invite their team." },
  { title: "Go live", body: "Point the client's domain at Prood. We provision it and turn on HTTPS." },
  { title: "Hand over or run it", body: "Let the client run the store, or keep running it for them through the dashboard or the API." },
] as const

export default function AgenciesPage() {
  const agency = getMarketingTier("agency", "monthly")

  return (
    <>
      <PageHero
        eyebrow="For agencies"
        title="One login. Every client store."
        lead="Build stores for your clients without rebuilding checkout and admin each time. Every client gets their own data, payment accounts and domain, and you run them all from one place."
      >
        <Button variant="brand" size="lg" className="h-11 px-5 text-base" asChild>
          <a href={siteConfig.registerUrl}>Start a client store</a>
        </Button>
        <Button variant="outline" size="lg" className="h-11 px-5 text-base" asChild>
          <a href={docsPage("guides/for-agencies")}>Read the agency guide</a>
        </Button>
      </PageHero>

      <Section labelledBy="isolation-title">
        <SectionHeading
          id="isolation-title"
          eyebrow="Isolation"
          title="Every client in their own space."
          description="Client stores never share data, keys or customers. Stores live on prood.app or the client's domain, apart from Prood's own services."
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2">
          {isolation.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-xl border border-border bg-card p-6">
              <Icon className="size-6 text-brand" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="steps-title">
        <SectionHeading id="steps-title" eyebrow="How it works" title="From kickoff to live store." />
        <ol className="mt-14 grid gap-8 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-foreground pt-5">
              <p className="font-mono text-sm text-brand tabular-nums">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="plan-title">
        <div className="grid items-center gap-12 rounded-2xl border border-border bg-card p-8 md:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeading
              id="plan-title"
              eyebrow="Agency plan"
              title={`${agency.price} ${agency.period}, up to 10 stores.`}
              description={agency.description}
            />
            <Button variant="brand" size="lg" className="mt-8 h-11 px-5 text-base" asChild>
              <a href={contactHref("Agency plan")}>{agency.cta}</a>
            </Button>
          </div>
          <ul className="space-y-3 text-[0.9375rem]">
            {agency.highlights.map((item) => (
              <li key={item} className="border-b border-border pb-3">
                {item}
              </li>
            ))}
            <li className="text-muted-foreground">
              Paid plans aren&apos;t billed yet. Start client stores on Free today.
            </li>
          </ul>
        </div>
      </Section>

      <ClosingCta
        title="Start your first client store."
        body="Set it up on Free, show it to the client on prood.app, and move to the Agency plan when you're running several."
      />
    </>
  )
}
