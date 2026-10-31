import {
  BracketsCurlyIcon,
  GlobeSimpleIcon,
  LockKeyIcon,
  PlugsConnectedIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ClosingCta } from "@/components/marketing/closing-cta"
import { PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { paymentProviders } from "@/lib/payment-providers"
import { pageMetadata } from "@/lib/metadata"
import { docsPage } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Integrations",
  description:
    "Connect Stripe, Easypay or Ifthenpay with your own accounts, bring your own domain, and build on the REST API and MCP server.",
  path: "/integrations",
})

const platform = [
  {
    icon: GlobeSimpleIcon,
    title: "Custom domains",
    body: "Add a domain in the dashboard and Prood provisions it on Vercel with HTTPS. Every store also has a prood.app address.",
  },
  {
    icon: BracketsCurlyIcon,
    title: "REST API",
    body: "Connect your ERP, shipping tools or spreadsheets through /v1 with an organization API key.",
  },
  {
    icon: PlugsConnectedIcon,
    title: "MCP server",
    body: "Give any MCP-compatible AI client access to the store through 40 tools, with your approval for changes.",
  },
] as const

export default function IntegrationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title="Your accounts, connected per store."
        lead="Each store connects its own payment accounts from the dashboard. Prood never holds your money and never shares keys between stores."
      />

      <Section labelledBy="payments-title">
        <SectionHeading
          id="payments-title"
          eyebrow="Payments"
          title="Three providers, live today."
          description="You pay your provider's processing fees. Prood adds nothing on top."
        />
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {paymentProviders.map((provider) => (
            <li key={provider.id} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold">{provider.name}</h3>
                <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
                  Live
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{provider.region}</p>
              <p className="mt-4 flex-1 leading-7 text-muted-foreground">{provider.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${provider.name} payment methods`}>
                {provider.methods.map((method) => (
                  <li key={method} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {method}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-start gap-3 text-[0.9375rem] leading-6 text-muted-foreground">
          <LockKeyIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <p>
            Credentials are encrypted for each store and only used to talk to your provider.{" "}
            <a
              href={docsPage("guides/payment-integration")}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Read the payment setup guide
            </a>
            .
          </p>
        </div>
      </Section>

      <Section labelledBy="platform-title">
        <SectionHeading id="platform-title" eyebrow="Platform" title="Domains and code." />
        <ul className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {platform.map(({ icon: Icon, title, body }) => (
            <li key={title} className="border-t border-border pt-5">
              <Icon className="size-6 text-brand" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <ClosingCta />
    </>
  )
}
