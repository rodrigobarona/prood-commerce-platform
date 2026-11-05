import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { Receipt } from "@prood/ui/components/receipt"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { StoreSpec } from "@/components/marketing/features"
import { Payments } from "@/components/marketing/payments"
import { PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { WaysToRun } from "@/components/marketing/ways-to-run"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.product)

const hosted = [
  { title: "Storefront", body: "Your catalog on a hosted store, on a prood.app address or your own domain." },
  { title: "Checkout", body: "Multibanco, MB WAY and cards on Prood's hosted checkout page, then back to your store." },
  { title: "Dashboard", body: "Products, orders, customers and refunds. No servers, updates or plugins to look after." },
] as const

const connections = [
  { title: "Payments", body: "Easypay or Ifthenpay for Multibanco, MB WAY and cards in one checkout, or Stripe for cards and wallets. Each on your own account." },
  { title: "Your domain", body: "Point your domain at your store and we set up HTTPS. Every store also has a prood.app address." },
  {
    title: "REST API and MCP",
    body: "Connect your own tools through /v1, or give an AI client the store's MCP tools. Free keys reach the storefront API and its 21 MCP tools. Admin calls start on Grow.",
  },
] as const

export default function ProductPage() {
  return (
    <>
      <PageHero
        eyebrow="Product"
        title={["What your", "store runs on."]}
        lead="Storefront, checkout, orders and an API, hosted in Frankfurt. Nothing to deploy: open a store, connect your payment account and sell on your own domain."
        image="keys-door"
        position="50% 45%"
        object={
          <Receipt
            className="w-72 origin-bottom-right -rotate-1 lg:w-80"
            heading="Your store"
            meta="Example"
            lines={[
              { label: "Storefront and checkout", value: "Hosted" },
              { label: "Domain", value: "Yours" },
              { label: "Payment accounts", value: "Yours" },
              { label: "To deploy", value: "Nothing", total: true, highlight: true },
            ]}
          />
        }
      >
        <Button variant="paper" size="hero" asChild>
          <a href={siteConfig.registerUrl}>Start free</a>
        </Button>
        <Button variant="on-photo" size="hero" asChild>
          <a href={siteConfig.demoStoreUrl}>See the demo store</a>
        </Button>
        <p className="basis-full text-xs text-paper/80">The demo store is sample data, and it doesn&apos;t take orders.</p>
      </PageHero>

      <Section labelledBy="hosted-title" className="pt-16 md:pt-24">
        <SectionHeading id="hosted-title" eyebrow="Hosted" title="We run it. You sell." />
        <ul className="mt-12 grid gap-x-8 gap-y-8 border-t border-border pt-8 lg:grid-cols-3">
          {hosted.map(({ title, body }) => (
            <li key={title}>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Payments />
      <WaysToRun />
      <StoreSpec className="" />

      <Section labelledBy="connections-title" className="pt-0 md:pt-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="connections-title" eyebrow="Integrations" title="Connects to what you already use." />
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 rounded-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
          >
            See every integration
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-12 grid gap-x-8 gap-y-8 border-t border-border pt-8 lg:grid-cols-3">
          {connections.map(({ title, body }) => (
            <li key={title}>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <ClosingCta />
    </>
  )
}
