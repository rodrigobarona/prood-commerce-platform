import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRightIcon,
  BookOpenIcon,
  BracketsCurlyIcon,
  CreditCardIcon,
  FileCodeIcon,
  PlugsConnectedIcon,
  TerminalWindowIcon,
} from '@phosphor-icons/react/dist/ssr';
import { MediaImage } from '@prood/media/image';
import { Button } from '@prood/ui/components/button';
import { KeyMark } from '@prood/ui/components/key-mark';
import { TileEdge } from '@prood/ui/components/tile';
import { CodeWindow } from '@/components/code-window';
import { Container, Section, SectionHeading } from '@/components/marketing';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'Prood docs' },
  description:
    'How to open a store on Prood, take payments through your own accounts and build on the API. For merchants, agencies, developers and AI agents.',
};

const routes = [
  {
    title: 'Merchants',
    image: 'shop-shelves',
    position: '62% 40%',
    body: 'Open a store, add your products, connect a payment account and go live on your own domain.',
    links: [
      { label: 'Merchant guide', href: '/docs/guides/for-merchants' },
      { label: 'Onboarding checklist', href: '/docs/guides/merchant-onboarding' },
      { label: 'Connect a payment account', href: '/docs/guides/payment-integration' },
    ],
  },
  {
    title: 'Agencies',
    image: 'team-workshop',
    position: '50% 40%',
    body: "Build and run client stores, each with its own data, payment accounts and domain.",
    links: [
      { label: 'Agency guide', href: '/docs/guides/for-agencies' },
      { label: 'Custom domains', href: '/docs/apps/dashboard/domains' },
      { label: 'Team invites', href: '/docs/apps/dashboard/team' },
    ],
  },
  {
    title: 'Developers',
    image: 'workshop-measure',
    position: '70% 35%',
    body: 'Build on the API the dashboard uses, with an OpenAPI 3.1 spec and a typed client.',
    links: [
      { label: 'API reference', href: '/docs/api' },
      { label: 'TypeScript client', href: '/docs/packages/api-client' },
      { label: 'Architecture', href: '/docs/architecture/overview' },
    ],
  },
  {
    title: 'AI agents',
    image: 'keys-door',
    position: '60% 50%',
    body: "With Agent Auth, an AI agent starts with nothing until you approve it for your store. Agent Auth starts on Grow. Paid plans are coming.",
    links: [
      { label: 'Agent Auth', href: '/docs/apps/api/agent-auth' },
      { label: 'MCP server', href: '/docs/apps/api/mcp' },
      { label: 'Read llms.txt', href: '/llms.txt', plain: true },
    ],
  },
] as const;

const steps = [
  {
    title: 'Create a store',
    body: 'Register on the dashboard. Every plan includes a prood.app address and a key for the public storefront API.',
  },
  {
    title: 'Make an API key',
    body: 'Open API keys in the dashboard. The key belongs to your organization and is shown once.',
  },
  {
    title: 'Call the API',
    body: 'Send the key in the x-api-key header. Free API keys reach the public storefront API: catalog, carts and placing orders. Reading your orders and customers by API, and all admin writes, start on Grow.',
  },
] as const;

const reference = [
  {
    icon: BracketsCurlyIcon,
    title: 'REST API',
    body: 'Every operation under /v1, with schemas and a request console.',
    href: '/docs/api',
  },
  {
    icon: PlugsConnectedIcon,
    title: 'MCP server',
    body: 'Tools that mirror the REST API, for any MCP-compatible client.',
    href: '/docs/apps/api/mcp',
  },
  {
    icon: TerminalWindowIcon,
    title: 'prood CLI',
    body: 'Check a key, list products, and print MCP client config. Available from the source repo for now.',
    href: '/docs/guides/machine-access',
  },
  {
    icon: CreditCardIcon,
    title: 'Payments',
    body: 'Stripe, Easypay and Ifthenpay, connected per store.',
    href: '/docs/packages/payments',
  },
  {
    icon: FileCodeIcon,
    title: 'Webhooks',
    body: "Point your provider's notifications at Prood, so orders are marked paid.",
    href: '/docs/guides/webhook-setup',
  },
  {
    icon: BookOpenIcon,
    title: 'Plans and limits',
    body: 'What each plan includes and where the limits apply.',
    href: '/docs/billing/plans',
  },
] as const;

export default function HomePage() {
  return (
    <>
      <div className="relative">
        <div className="surface-ink relative -mt-16 flex min-h-[max(72svh,36rem)] flex-col justify-end overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-full md:w-[70%]">
            <MediaImage
              slug="bench-notes"
              fill
              preload
              sizes="(min-width: 768px) 70vw, 200vw"
              className="object-cover"
              style={{ objectPosition: '70% 40%' }}
            />
          </div>
          <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-ink/70 to-transparent" />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/50 to-ink/40 md:bg-linear-to-r md:from-ink md:from-30% md:via-ink/60 md:via-55% md:to-ink/5"
          />
          <Container className="relative pt-32 pb-20 md:pb-24">
            <p className="text-eyebrow text-paper">Prood docs</p>
            <h1 className="mt-4 max-w-3xl text-display-lg text-paper">The keys to your store.</h1>
            <p className="mt-6 max-w-xl text-lead text-paper/90">
              How to open a store on Prood, take payments through your own accounts and build on the
              API. Written for merchants, agencies, developers and AI agents.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="paper" size="hero" asChild>
                <Link href="/docs/getting-started/quick-start">
                  Open the quick start
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button variant="on-photo" size="hero" asChild>
                <Link href="/docs/api">Browse the API</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-paper/80">Stock photographs. Not Prood customers.</p>
          </Container>
        </div>
        <TileEdge awning className="absolute inset-x-0 bottom-0 text-background" />
      </div>

      <Section labelledBy="routes-title">
        <SectionHeading
          id="routes-title"
          eyebrow="Start here"
          title="Pick your way in."
          description="Four kinds of people use Prood. Each has a short path through these docs."
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {routes.map((route) => (
            <li
              key={route.title}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[3/2] bg-muted">
                <MediaImage
                  slug={route.image}
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: route.position }}
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-display-sm">{route.title}</h3>
                <p className="mt-3 flex-1 leading-7 text-muted-foreground">{route.body}</p>
                <ul className="mt-5 space-y-2">
                  {route.links.map((link) => {
                    const className =
                      'rounded-sm text-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand';
                    return (
                      <li key={link.href}>
                        {'plain' in link ? (
                          <a href={link.href} className={className}>
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">Stock photographs. Not Prood customers.</p>
      </Section>

      <Section labelledBy="quick-start-title" surface="ink">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="min-w-0">
            <KeyMark className="mb-6 w-24 text-brand" />
            <SectionHeading
              id="quick-start-title"
              eyebrow="Quick start"
              title="Call the API in three steps."
            />
            <ol className="mt-10 space-y-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="mt-1 font-mono text-sm text-brand tabular-nums" aria-hidden>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-7 text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="paper" size="hero" asChild>
                <a href={site.registerUrl}>
                  Create a store
                  <ArrowRightIcon data-icon="inline-end" />
                </a>
              </Button>
              <Button variant="on-photo" size="hero" asChild>
                <Link href="/docs/run-locally/installation">Run it locally</Link>
              </Button>
            </div>
          </div>
          <CodeWindow
            title="zsh"
            className="min-w-0"
            lines={[
              { text: '# Check the key', tone: 'comment' },
              { text: 'curl https://api.prood.com/v1/me \\', tone: 'command' },
              { text: '  -H "x-api-key: $PROOD_API_KEY"', tone: 'command' },
              { text: '{ "organizationId": "org_abc123",', tone: 'output' },
              { text: '  "scopes": ["storefront"],', tone: 'output' },
              { text: '  "via": "api-key" }', tone: 'output' },
              { text: '' },
              { text: "# List the store's products", tone: 'comment' },
              { text: 'curl https://api.prood.com/v1/products \\', tone: 'command' },
              { text: ' -H "x-api-key: $PROOD_API_KEY"', tone: 'command' },
            ]}
          />
        </div>
      </Section>

      <Section labelledBy="reference-title">
        <SectionHeading id="reference-title" eyebrow="Reference" title="Look something up." />
        <ul className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reference.map(({ icon: Icon, title, body, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="flex h-full gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-input"
              >
                <Icon className="mt-0.5 size-6 shrink-0 text-brand" aria-hidden />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block leading-7 text-muted-foreground">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
