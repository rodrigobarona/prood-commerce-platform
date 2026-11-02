import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { KeyMark } from "@prood/ui/components/key-mark"
import { TileEdge, TileField } from "@prood/ui/components/tile"
import { ProviderPricing } from "@/components/marketing/payments"
import { IntegrationsSample } from "@/components/marketing/samples"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { Container, Eyebrow, Photo, Section } from "@/components/marketing/section"
import { MoneyPath } from "@/components/marketing/money-path"
import { paymentProviders } from "@/lib/payment-providers"
import { pageMetadata } from "@/lib/metadata"
import { docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Integrations",
  description:
    "Connect Stripe, Easypay or Ifthenpay with your own accounts, bring your own domain, and build on the REST API and MCP server.",
  path: "/integrations",
})

const platform = [
  {
    title: "Custom domains",
    body: "Add a domain in the dashboard, point your DNS at your store, and we set up HTTPS for you. Every store also has a prood.app address.",
  },
  {
    title: "REST API",
    body: "Connect your ERP, shipping tools or spreadsheets through /v1 with an organization API key. Reading orders and customers, and all admin writes, start on Grow, and paid plans can't be bought yet.",
  },
  {
    title: "MCP server",
    body: "Give any MCP-compatible AI client access to the store through 41 tools. Free keys reach the 21 storefront tools. With Agent Auth, an AI agent starts with nothing until you approve it for your store. Agent Auth is coming with Grow. An admin key doesn't ask.",
  },
] as const

export default function IntegrationsPage() {
  return (
    <>
      {/*
        No photograph here: the brand's own key is the poster. It points in from the right edge, which takes less than
        a third of the bow, and its tip lands on the page's center line. All of it stays above the seam.
      */}
      <div className="relative overflow-x-clip">
        <div className="surface-ink surface-photo relative -mt-16 overflow-hidden lg:min-h-[max(52rem,46vw)]">
          <TileField size={56} className="text-foreground/[0.04] [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
          <Container className="relative pt-32 lg:pt-40">
            <Eyebrow className="text-paper">Integrations</Eyebrow>
            <h1 className="mt-4 text-display-lg text-paper max-sm:text-[10.2vw]">
              <span className="block">Bring your own</span>
              <span className="block">payment account.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lead text-paper/90 lg:max-w-[min(36rem,calc(50vw-6rem))]">
              Payouts go straight from your provider to you. Each store connects its own account from the dashboard.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="paper" size="hero" asChild>
                <a href={siteConfig.registerUrl}>
                  Start free
                  <ArrowRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <Button variant="on-photo" size="hero" asChild>
                <a href={docsPage("guides/payment-integration")}>Read the payment setup guide</a>
              </Button>
            </div>
          </Container>
          <KeyMark
            cut
            className="relative mt-12 mb-16 ml-5 w-[calc(115vw-1.55rem)] -scale-x-100 text-telha sm:ml-8 sm:w-[calc(115vw-2.5rem)] lg:absolute lg:bottom-14 lg:left-1/2 lg:m-0 lg:w-[57vw]"
          />
        </div>
        <TileEdge className="absolute inset-x-0 top-full text-ink" />
      </div>

      <Section labelledBy="payments-title" className="pt-24 md:pt-36">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div>
            <Eyebrow>Payments</Eyebrow>
            <h2 id="payments-title" className="mt-4 text-display-md">
              Three providers, built in.
            </h2>
            <p className="mt-6 text-lead text-muted-foreground">
              You pay your provider&apos;s processing fees. Prood adds nothing on top.
            </p>
          </div>
          <IntegrationsSample />
        </div>
        <ul className="mt-14 grid gap-x-8 gap-y-8 border-t border-border pt-8 lg:grid-cols-3">
          {paymentProviders.map((provider) => (
            <li key={provider.id}>
              <h3 className="text-xl font-semibold">{provider.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{provider.region}</p>
              <p className="mt-3 leading-7 text-muted-foreground">{provider.summary}</p>
              <a
                href={provider.pricingUrl}
                className="mt-2 inline-block rounded-sm text-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
              >
                {provider.pricingAction}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-[0.9375rem] leading-6 text-muted-foreground">
          Each store&apos;s credentials are stored separately, encrypted, and only used to talk to your provider.{" "}
          <a href={docsPage("guides/payment-integration")} className="font-medium text-foreground underline underline-offset-4">
            Read the payment setup guide
          </a>
          .
        </p>
      </Section>

      <Section labelledBy="route-title" surface="ink">
        <h2 id="route-title" className="text-display-md">
          Where the money goes.
        </h2>
        <MoneyPath className="mt-12 md:mt-16" />
      </Section>

      <Section labelledBy="platform-title">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Photo slug="street-tiles" sizes="(min-width: 1024px) 54vw, 120vw" position="50% 60%" className="aspect-[4/3]" />
          <div>
            <Eyebrow>Platform</Eyebrow>
            <h2 id="platform-title" className="mt-4 text-display-md">
              Domains and code.
            </h2>
            <dl className="mt-10 border-b border-border">
              {platform.map(({ title, body }) => (
                <div key={title} className="border-t border-border py-4">
                  <dt className="font-medium">{title}</dt>
                  <dd className="mt-1 leading-7 text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <ClosingCta
        title="Connect your own account today."
        slip={{
          heading: "Per store",
          lines: [
            { label: "Payment accounts", value: "Yours" },
            { label: "Provider's fee", value: "Their rates" },
            { label: "Domain", value: "Yours" },
            { label: "Payouts", value: "Direct to you", total: true, highlight: true },
          ],
          footer: <ProviderPricing />,
        }}
      />
    </>
  )
}
