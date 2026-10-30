import {
  BracketsCurlyIcon,
  FileCodeIcon,
  KeyIcon,
  PlugsConnectedIcon,
  ShieldCheckIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { CodeWindow } from "@/components/marketing/code-window"
import { PageHero, Section, SectionHeading } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "For developers and AI agents",
  description:
    "A REST API with more than 40 operations, an OpenAPI 3.1 spec, a TypeScript client, the prood CLI and an MCP server with 40 tools. Agents need approval before they change anything.",
  path: "/developers",
})

const surfaces = [
  {
    icon: BracketsCurlyIcon,
    title: "REST API",
    body: "More than 40 operations under /v1 for catalog, carts, checkout, orders, customers and store settings.",
    href: docsPage("apps/api/endpoints"),
    link: "Endpoints",
  },
  {
    icon: FileCodeIcon,
    title: "OpenAPI and TypeScript",
    body: "An OpenAPI 3.1 spec at /v1/openapi.json and a typed client generated from it.",
    href: docsPage("packages/api-client"),
    link: "API client",
  },
  {
    icon: TerminalWindowIcon,
    title: "prood CLI",
    body: "Check who you're signed in as, list products and orders, and print MCP client config.",
    href: docsPage("guides/machine-access"),
    link: "Machine access",
  },
  {
    icon: PlugsConnectedIcon,
    title: "MCP server",
    body: "40 tools at /mcp that mirror the REST API, for any MCP-compatible client.",
    href: docsPage("apps/api/mcp"),
    link: "MCP docs",
  },
] as const

const guardrails = [
  {
    icon: KeyIcon,
    title: "API keys for your code",
    body: "Create keys per organization in the dashboard and send them in the x-api-key header.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Agent Auth for AI agents",
    body: "Agents discover the API at /.well-known/agent-configuration and register. Reads can be granted automatically; anything that changes data needs the merchant's approval first.",
  },
] as const

export default function DevelopersPage() {
  return (
    <>
      <PageHero
        eyebrow="For developers and AI agents"
        title="Commerce you can call."
        lead="Every Prood store comes with the API the dashboard is built on. Write your own integrations, script the boring parts, or let an AI agent help, with the merchant deciding what it may change."
        aside={
          <CodeWindow
            title="Agent Auth discovery"
            lines={[
              { text: "curl https://api.prood.com/.well-known/agent-configuration", tone: "command" },
              { text: "" },
              { text: "# Reads can be granted automatically", tone: "comment" },
              { text: "listProducts, getProduct, …", tone: "output" },
              { text: "# Anything that changes data needs approval", tone: "comment" },
              { text: "adminCreateProduct, adminRefundOrder, …", tone: "output" },
            ]}
          />
        }
      >
        <Button variant="brand" size="lg" className="h-11 px-5 text-base" asChild>
          <a href={siteConfig.apiReferenceUrl}>API reference</a>
        </Button>
        <Button variant="outline" size="lg" className="h-11 px-5 text-base" asChild>
          <a href={docsPage("getting-started/quick-start")}>Quick start</a>
        </Button>
      </PageHero>

      <Section labelledBy="surfaces-title">
        <SectionHeading
          id="surfaces-title"
          eyebrow="Build"
          title="Four ways into the same store."
          description="One data model and one set of permissions, whichever you pick."
        />
        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {surfaces.map(({ icon: Icon, title, body, href, link }) => (
            <li key={title} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <Icon className="size-6 text-brand" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 flex-1 leading-7 text-muted-foreground">{body}</p>
              <a
                href={href}
                className="mt-5 w-fit rounded-sm text-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="guardrails-title" inverted>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="guardrails-title"
              eyebrow="Access"
              title="Agents ask first. Merchants decide."
              description="Write access to the API and MCP and Agent Auth are on Grow and above. Free includes read-only access."
            />
            <ul className="mt-10 space-y-8">
              {guardrails.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <Icon className="mt-1 size-6 shrink-0 text-brand" aria-hidden />
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-1 leading-7 text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <CodeWindow
            title="zsh"
            lines={[
              { text: "# Create a product with an organization key", tone: "comment" },
              { text: "curl -X POST https://api.prood.com/v1/admin/products \\", tone: "command" },
              { text: '  -H "x-api-key: $PROOD_API_KEY" \\', tone: "command" },
              { text: '  -H "content-type: application/json" \\', tone: "command" },
              { text: "  -d @linen-tote.json", tone: "command" },
              { text: "" },
              { text: "# Check the key from the CLI", tone: "comment" },
              { text: "prood auth whoami --api-url https://api.prood.com/v1 --json", tone: "command" },
            ]}
          />
        </div>
      </Section>

      <ClosingCta
        title="Get an API key in minutes."
        body="Create a free store, open Settings and make a key. The read-only API is on every plan."
      />
    </>
  )
}
