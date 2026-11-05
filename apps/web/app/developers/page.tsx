import { CheckIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { TileEdge } from "@prood/ui/components/tile"
import { ClosingCta } from "@/components/marketing/closing-cta"
import { CodeWindow } from "@/components/marketing/code-window"
import { HungKey, KeyTag } from "@/components/marketing/key-tag"
import { ApprovalSample, KeyLedger } from "@/components/marketing/samples"
import { Container, Eyebrow, Section } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { contactHref, docsPage, siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.developers)

const surfaces = [
  {
    title: "REST API",
    body: "More than 40 operations under /v1 for catalog, carts, orders, customers and store settings.",
    href: docsPage("apps/api/endpoints"),
    link: "Read the endpoints",
  },
  {
    title: "OpenAPI and TypeScript",
    body: "An OpenAPI 3.1 spec at /v1/openapi.json. The typed client, @prood/api-client, is generated from it. Available from the source repo for now.",
    href: docsPage("packages/api-client"),
    link: "Read about the API client",
  },
  {
    title: "prood CLI",
    body: "Check who you're signed in as, list products, and print MCP client config. @prood/cli is available from the source repo for now.",
    href: docsPage("guides/machine-access"),
    link: "Read about machine access",
  },
  {
    title: "MCP server",
    body: "41 tools at /mcp that mirror the REST API, for any MCP-compatible client. Free keys reach the 21 storefront tools. 18 do useful work today: the MCP docs list the three that don't.",
    href: docsPage("apps/api/mcp"),
    link: "Read the MCP docs",
  },
] as const

const scopes = [
  {
    title: "Storefront",
    plan: "Every plan",
    body: "The public storefront API: catalog, carts and placing orders.",
    calls: ["GET /v1/products", "POST /v1/carts"],
  },
  {
    title: "Admin",
    plan: "From Grow",
    body: "Reading your orders and customers by API, and all admin writes. A key with only Admin can't call the storefront routes, such as /v1/products and carts. It reads products through /v1/admin/products.",
    calls: ["GET /v1/admin/orders", "POST /v1/admin/products"],
  },
  {
    title: "Both scopes",
    plan: "From Grow",
    body: "Catalog, carts, your orders and customers, and changes to the store, on one key.",
    calls: ["GET /v1/products", "PATCH /v1/admin/products/{id}"],
  },
] as const

type Access = boolean | string

const access: { label: string; catalog: Access; carts: Access; reads: Access; writes: Access }[] = [
  { label: "Free API key", catalog: true, carts: true, reads: false, writes: false },
  { label: "Key with both scopes, from Grow", catalog: true, carts: true, reads: true, writes: true },
  { label: "Agent Auth, from Grow", catalog: "After you approve", carts: "Asks you", reads: "Asks you", writes: "Asks you" },
]

function AccessCell({ value, label }: { value: Access; label: string }) {
  if (value === true) return <CheckIcon className="size-4 text-brand" weight="bold" aria-label={`${label}: yes`} />
  if (value === false) return <MinusIcon className="size-4 text-muted-foreground" aria-label={`${label}: no`} />
  return <span>{value}</span>
}

export default function DevelopersPage() {
  return (
    <>
      {/* On Paper, with no photograph: the key tag is the hero. */}
      <Container className="grid items-end gap-x-16 gap-y-12 pt-16 pb-10 md:pt-20 lg:grid-cols-[minmax(0,1fr)_30rem] lg:pb-16">
        <div>
          <Eyebrow>For developers and AI agents</Eyebrow>
          <h1 className="mt-4 text-display-lg max-sm:text-[10.2vw]">
            <span className="block">Commerce</span>
            <span className="block">you can call.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lead text-muted-foreground">
            Nothing to deploy. Prood runs the commerce engine, and /v1 is the API the dashboard is built on. Free keys
            reach catalog, carts and placing orders. Admin access starts on Grow. Multibanco and MB WAY are already at
            hosted checkout, through Easypay or Ifthenpay.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="hero" asChild>
              <a href={siteConfig.apiReferenceUrl}>Read the API reference</a>
            </Button>
            <Button variant="outline" size="hero" asChild>
              <a href={docsPage("getting-started/quick-start")}>Open the quick start</a>
            </Button>
          </div>
        </div>
        {/* The tag hangs across the seam into the next section. */}
        <div className="relative z-10 mx-auto -mb-24 w-full max-w-[30rem] lg:-mb-32">
          <span aria-hidden className="mx-auto block size-3 rounded-full bg-foreground" />
          <HungKey
            drop="6rem"
            string="text-foreground/60"
            keyClassName="-top-3 ml-2 w-16 origin-[2rem_2rem] -rotate-[52deg] text-foreground drop-shadow-none"
            className="rotate-2"
          >
            <KeyTag telha className="[&_article]:px-8 [&_article]:pb-8 sm:[&_article]:px-10 sm:[&_article]:pb-10">
              <p className="font-mono text-sm text-paper">Example key</p>
              <p className="mt-2 font-heading text-[clamp(2.75rem,8vw,4.5rem)] leading-none font-medium tracking-[-0.012em]">
                Storefront
              </p>
              <p className="mt-6 border-t border-dashed border-paper/50 pt-4 font-mono text-[clamp(0.875rem,3.6vw,1.125rem)]">
                x-api-key: pkAbC123...
              </p>
            </KeyTag>
          </HungKey>
        </div>
      </Container>

      <Section labelledBy="surfaces-title" surface="muted" className="relative pt-36 md:pt-44">
        <TileEdge className="absolute inset-x-0 top-0 text-background" />
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="min-w-0">
            <Eyebrow>Build</Eyebrow>
            <h2 id="surfaces-title" className="mt-4 text-display-md">
              Four ways into the same store.
            </h2>
            <p className="mt-6 text-lead text-muted-foreground">
              One data model, whichever you pick. What you can do depends on the key or grant you hold.
            </p>
            <ul className="mt-10 border-b border-border">
              {surfaces.map(({ title, body, href, link }) => (
                <li key={title} className="border-t border-border py-5">
                  <h3 className="font-sans text-base font-semibold">{title}</h3>
                  <p className="mt-1 leading-7 text-muted-foreground">{body}</p>
                  <a
                    href={href}
                    className="mt-2 inline-block rounded-sm text-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-ink min-w-0 rounded-3xl sm:p-6 lg:sticky lg:top-24">
            <CodeWindow
              title="zsh"
              lines={[
                { text: "# Check a key with Storefront", tone: "comment" },
                { text: "prood auth whoami --json \\", tone: "command" },
                { text: "  --api-url https://api.prood.com/v1", tone: "command" },
                { text: "" },
                { text: "# Create a product (Grow and above)", tone: "comment" },
                { text: "curl -X POST \\", tone: "command" },
                { text: "  https://api.prood.com/v1/admin/products \\", tone: "command" },
                { text: '  -H "x-api-key: $PROOD_API_KEY" \\', tone: "command" },
                { text: '  -H "content-type: application/json" \\', tone: "command" },
                { text: "  -d @linen-tote.json", tone: "command" },
                { text: " " },
                { text: "# Point an MCP client at the store", tone: "comment" },
                { text: "prood mcp config \\", tone: "command" },
                { text: "  --api-url https://api.prood.com/v1 ", tone: "command" },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section labelledBy="scopes-title" className="relative">
        <TileEdge className="absolute inset-x-0 top-0 text-muted" />
        <div className="max-w-3xl">
          <Eyebrow>Keys</Eyebrow>
          <h2 id="scopes-title" className="mt-4 text-display-md">
            A key reaches what its scopes say.
          </h2>
          <p className="mt-6 text-lead text-muted-foreground">
            Choose Storefront, Admin or both when you make a key. Payment accounts, domains, team and keys stay in the
            dashboard. Paid plans can&apos;t be bought yet, so every key today is a Storefront key. Want to know when admin access opens?{" "}
            <a href={contactHref("Admin API access")} className="font-medium text-foreground underline underline-offset-4">
              Email us
            </a>
            .
          </p>
        </div>
        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          {/* The ledger stays put while the scopes pass beside it, hanging from the same bar as the plan slips. */}
          <div className="min-w-0 lg:sticky lg:top-28">
            <div aria-hidden className="relative z-10 h-2.5 rounded-full bg-foreground" />
            <KeyLedger className="-mt-1 px-2" />
          </div>
          <ul className="min-w-0 border-b border-border">
            {scopes.map(({ title, plan, body, calls }) => (
              <li key={title} className="border-t border-border py-8 md:py-12">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="text-display-sm">{title}</h3>
                  <p className="text-sm text-muted-foreground">{plan}</p>
                </div>
                <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{body}</p>
                <p className="mt-5 text-xs text-muted-foreground">Example calls</p>
                <ul className="mt-1.5 space-y-1 font-mono text-sm">
                  {calls.map((call) => (
                    <li key={call}>{call}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section labelledBy="guardrails-title" surface="ink" className="relative">
        <TileEdge className="absolute inset-x-0 top-0 text-background" />
        <div className="grid items-end gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <Eyebrow>Access</Eyebrow>
            <h2 id="guardrails-title" className="mt-4 text-display-md">
              With Agent Auth, agents ask you.
            </h2>
            <p className="mt-6 text-lead text-muted-foreground">
              With Agent Auth, an AI agent starts with nothing until you approve it for your store.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              After that it keeps the public catalog, and anything else needs your approval. You see every capability the
              agent asks for and approve or deny the request as a whole. Approved access ends after an hour idle, or 24
              hours at most. Then the agent asks again.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              An API key isn&apos;t Agent Auth: anything holding an admin key can do what the key allows, without asking.
              Agent Auth is coming with Grow.
            </p>
          </div>
          <ApprovalSample className="[&_.bg-card]:shadow-none" />
        </div>

        <div
          role="region"
          tabIndex={0}
          aria-label="What each kind of access reaches. Scroll sideways on a small screen."
          className="scroll-cue mt-14 overflow-x-auto rounded-xl border border-border bg-card"
        >
          <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
            <caption className="sr-only">What each kind of key or grant can reach</caption>
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <td className="px-5 py-3.5" />
                <th scope="col" className="px-4 py-3.5 font-sans font-medium">Public catalog</th>
                <th scope="col" className="px-4 py-3.5 font-sans font-medium">Carts and placing orders</th>
                <th scope="col" className="px-4 py-3.5 font-sans font-medium">Read orders and customers</th>
                <th scope="col" className="px-4 py-3.5 font-sans font-medium">Change the store</th>
              </tr>
            </thead>
            <tbody>
              {access.map((row) => (
                <tr key={row.label} className="border-t border-border first:border-0">
                  <th scope="row" className="px-5 py-3.5 font-sans font-medium whitespace-nowrap">{row.label}</th>
                  <td className="px-4 py-3.5"><AccessCell value={row.catalog} label="Public catalog" /></td>
                  <td className="px-4 py-3.5"><AccessCell value={row.carts} label="Carts and placing orders" /></td>
                  <td className="px-4 py-3.5"><AccessCell value={row.reads} label="Read orders and customers" /></td>
                  <td className="px-4 py-3.5"><AccessCell value={row.writes} label="Change the store" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
          Payment runs on hosted checkout, started from your store. Free API keys reach the public storefront API: catalog,
          carts and placing orders. Reading your orders and customers by API, and all admin writes, start on Grow. Each
          store's payment credentials are stored separately and encrypted at rest with AES-256-GCM. The ticks in the second row need both scopes: a key with only Admin doesn&apos;t reach the catalog or carts columns.
          Agents discover the API at /.well-known/agent-configuration.
        </p>
      </Section>

      <ClosingCta
        title="Get an API key in minutes."
        body="Create a free store, open API keys and make one. Free keys reach the public storefront API."
        slip={{
          heading: "By key",
          meta: "MCP tools each one reaches",
          lines: [
            { label: "Storefront, on Free", value: "21 tools" },
            { label: "Admin, from Grow", value: "20 tools" },
            { label: "Both scopes", value: "41 tools", total: true, highlight: true },
          ],
        }}
      />
    </>
  )
}
