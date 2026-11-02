import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@prood/ui/components/button"
import { BrowserFrame } from "@prood/ui/components/device-frame"
import { Input } from "@prood/ui/components/input"
import { KeyMark } from "@prood/ui/components/key-mark"
import { Label } from "@prood/ui/components/label"
import { Logo, LogoMark, Wordmark } from "@prood/ui/components/logo"
import { Panel } from "@prood/ui/components/panel"
import { Receipt } from "@prood/ui/components/receipt"
import { Stat, StatGrid } from "@prood/ui/components/stat-grid"
import { StatusBadge } from "@prood/ui/components/status-badge"
import { TileEdge, TileField } from "@prood/ui/components/tile"
import { CheckoutSample, OrdersSample } from "@/components/marketing/samples"
import { Container, Eyebrow, Photo } from "@/components/marketing/section"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Design system",
  description:
    "The Prood design system: receipt paper, the roof tile and the people behind the counter. Color, type, components and photography across every Prood app.",
  path: "/design",
})

const colors = [
  { name: "Ink", token: "ink", className: "bg-ink text-paper", note: "Text and the default action" },
  { name: "Paper", token: "paper", className: "bg-paper text-ink border border-border", note: "The canvas, like receipt paper" },
  { name: "Telha", token: "telha", className: "bg-telha text-paper", note: "The one signal. Use it rarely" },
] as const

const semantic = [
  { token: "muted", className: "bg-muted" },
  { token: "brand-subtle", className: "bg-brand-subtle" },
  { token: "success", className: "bg-success" },
  { token: "warning", className: "bg-warning" },
  { token: "destructive", className: "bg-destructive" },
  { token: "chart-2", className: "bg-chart-2" },
  { token: "chart-3", className: "bg-chart-3" },
  { token: "chart-4", className: "bg-chart-4" },
] as const

const type = [
  { name: "text-display-xl", className: "text-display-xl", sample: "Commerce, ready to run." },
  { name: "text-display-lg", className: "text-display-lg", sample: "Keep the keys." },
  { name: "text-display-md", className: "text-display-md", sample: "The parts a store runs on." },
  { name: "text-display-sm", className: "text-display-sm", sample: "Your payment accounts" },
  { name: "text-lead", className: "text-lead", sample: "The paragraph under a display heading." },
  { name: "text-eyebrow", className: "text-eyebrow", sample: "Above a title" },
] as const

const film = ["owner-tiles", "maker-studio", "street-tiles", "parcel-twine", "product-candle", "keys-door"] as const

function Block({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border py-16 md:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 id={id} className="mt-3 text-display-sm">
              {title}
            </h2>
            {intro ? <p className="mt-3 leading-7 text-muted-foreground">{intro}</p> : null}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </section>
  )
}

export default function DesignPage() {
  return (
    <>
      <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <div>
          <Eyebrow>Design system</Eyebrow>
          <h1 className="mt-4 text-display-lg">The store before the software.</h1>
          <p className="mt-6 max-w-2xl text-lead text-muted-foreground">
            One system for every Prood surface, drawn from a shop on a Portuguese street: receipt paper, the roof tile and
            the people behind the counter.
          </p>
        </div>
        <figure className="surface-ink relative h-[28rem] overflow-hidden rounded-3xl">
          <figcaption className="sr-only">The two materials: a receipt under a course of roof tiles, on Ink.</figcaption>
          <TileField size={28} className="text-foreground/[0.08]" />
          <TileEdge size={36} className="absolute inset-x-0 top-0 text-telha" />
          <Receipt
            className="absolute top-20 left-1/2 w-72 -translate-x-1/2 rotate-2"
            heading="Order ORD-20261031-4K2Q"
            meta="Example order"
            lines={[
              { label: "Stoneware mug × 2", value: "€48.00" },
              { label: "Shipping", value: "€15.00" },
              { label: "Total", value: "€63.00", total: true },
              { label: "Paid by", value: "Multibanco" },
              { label: "Payout", value: "Direct to you", highlight: true },
            ]}
          />
        </figure>
      </Container>

      <Block id="logo-title" eyebrow="Logo" title="Drawn, not typed." intro="One stroke weight and perfect circles. The mark is a Telha roof tile off the eave, flat at the head and round at the foot, with the wordmark's p running off its lower edge.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
            <Logo className="h-9" />
          </div>
          <div className="surface-ink flex h-40 items-center justify-center rounded-xl">
            <Wordmark className="h-9" />
          </div>
          <div className="flex h-40 items-center justify-center rounded-xl bg-muted">
            <LogoMark className="size-16" />
          </div>
        </div>
      </Block>

      <Block id="key-title" eyebrow="The key" title="Ring, stroke, two tiles." intro="The wordmark's ring is the bow and its stroke the shaft. The bit is two tiles off the eave. It hangs on the key board, and it marks anything to do with keys.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
            <KeyMark className="w-32" />
          </div>
          <div className="surface-ink flex h-40 items-center justify-center rounded-xl">
            <KeyMark className="w-32 text-telha" />
          </div>
          <div className="flex h-40 items-center justify-center gap-6 rounded-xl bg-muted">
            <KeyMark hanging className="w-11 text-foreground" />
            <KeyMark hanging className="w-7 text-telha" />
            <KeyMark className="w-12 text-foreground" />
          </div>
        </div>
      </Block>

      <Block id="color-title" eyebrow="Color" title="One loud color." intro="Ink and Paper do the work. Telha shows up rarely, so that it keeps meaning. The core pairs are measured against WCAG 2.2 AA.">
        <ul className="grid gap-4 sm:grid-cols-3">
          {colors.map((color) => (
            <li key={color.name} className={`flex h-48 flex-col justify-between rounded-xl p-5 ${color.className}`}>
              <span className="text-display-sm">{color.name}</span>
              <span className="text-sm">
                <span className="block font-mono text-xs">{color.token}</span>
                {color.note}
              </span>
            </li>
          ))}
        </ul>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {semantic.map((color) => (
            <li key={color.token}>
              <div className={`h-14 rounded-lg border border-border ${color.className}`} />
              <p className="mt-2 font-mono text-xs text-muted-foreground">{color.token}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="type-title" eyebrow="Type" title="Three families, one voice." intro="Bricolage Grotesque for headings, Instrument Sans for reading, Geist Mono for anything a machine could read.">
        <ul className="divide-y divide-border">
          {type.map((row) => (
            <li key={row.name} className="py-5 first:pt-0">
              <p className="font-mono text-xs text-muted-foreground">{row.name}</p>
              <p className={`mt-2 ${row.className}`}>{row.sample}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="surface-title" eyebrow="Surfaces" title="Panels restyle what's inside." intro="A surface reassigns the tokens, so most components carry over. Button keeps its paper and on-photo variants for photographs.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="font-mono text-xs text-muted-foreground">Page</p>
            <p className="mt-8 text-display-sm">Paper</p>
            <Button className="mt-4">Add product</Button>
          </div>
          <div className="surface-ink relative overflow-hidden rounded-xl p-6">
            <TileField size={28} className="text-foreground/[0.07]" />
            <p className="relative font-mono text-xs text-muted-foreground">surface-ink</p>
            <p className="relative mt-8 text-display-sm">Ink</p>
            <Button className="relative mt-4">Add product</Button>
          </div>
          <div className="surface-telha relative overflow-hidden rounded-xl p-6">
            <TileField size={28} className="text-paper/[0.14]" />
            <p className="relative font-mono text-xs">surface-telha</p>
            <p className="relative mt-8 text-display-sm">Telha</p>
            <Button className="relative mt-4">Start free</Button>
          </div>
        </div>
      </Block>

      <Block id="motif-title" eyebrow="Motif" title="The tile and the receipt." intro="Filled tiles from the wordmark's ring, always hanging downward like an eave. The receipt is where Paper comes from.">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl">
            <div className="surface-ink relative h-32 overflow-hidden">
              <TileField size={28} className="text-foreground/[0.08]" />
            </div>
            <div className="relative h-20 bg-background">
              <TileEdge className="absolute inset-x-0 top-0 text-ink" />
            </div>
          </div>
          <div className="flex justify-center rounded-xl bg-muted py-10">
            <Receipt
              className="w-64 -rotate-1"
              heading="What you keep"
              lines={[
                { label: "Your domain", value: "Yours" },
                { label: "Payment accounts", value: "Yours" },
                { label: "API keys", value: "Yours" },
                { label: "Payouts", value: "Direct to you", total: true, highlight: true },
              ]}
            />
          </div>
        </div>
      </Block>

      <Block id="actions-title" eyebrow="Controls" title="Buttons and fields.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Add product</Button>
          <Button variant="brand">Connect Stripe</Button>
          <Button variant="outline">Add product</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete product</Button>
        </div>
        <div className="surface-ink mt-4 flex flex-wrap items-center gap-3 rounded-xl p-5">
          <Button variant="paper" size="hero">
            Start free
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button variant="on-photo" size="hero">
            Read the docs
          </Button>
        </div>
        <div className="mt-8 grid max-w-md gap-2">
          <Label htmlFor="design-domain">Store domain</Label>
          <Input id="design-domain" defaultValue="loja.casalume.example" />
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <StatusBadge tone="success">Paid</StatusBadge>
          <StatusBadge tone="warning">Awaiting payment</StatusBadge>
          <StatusBadge tone="danger">Payment failed</StatusBadge>
          <StatusBadge tone="info">Shipped</StatusBadge>
          <StatusBadge tone="brand">Grow plan</StatusBadge>
          <StatusBadge>Draft</StatusBadge>
        </div>
      </Block>

      <Block id="product-title" eyebrow="Product UI" title="Quiet, dense, honest." intro="Every signed-in page starts with a PageHeader. Numbers sit in a StatGrid, lists in a Panel.">
        <div className="space-y-6">
          {/* PageHeader's title is an h1, and this page already has its own, so it's set as a specimen here. */}
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="font-heading text-2xl font-medium tracking-[-0.02em]">Orders</p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Every order in your store, with payment and fulfillment status.
              </p>
            </div>
            <Button size="lg">Add product</Button>
          </div>
          <StatGrid>
            <Stat label="Orders" value="128" hint="Sample data" />
            <Stat label="Sales" value="€6,420.00" hint="Sample data" />
            <Stat label="Customers" value="94" hint="Sample data" />
            <Stat label="Products" value="42" hint="Sample data" />
          </StatGrid>
          <Panel title="Setup" description="Two steps left before you can take orders.">
            <p className="flex items-center gap-2 text-sm">
              <CheckCircleIcon className="size-5 text-success" weight="fill" aria-hidden />
              Add your first product
            </p>
          </Panel>
          <OrdersSample />
        </div>
      </Block>

      <Block id="devices-title" eyebrow="On marketing" title="Show the real thing." intro="Product visuals use real components where they can, simplified by hand where they can't, always with sample data, framed in a browser or a phone.">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <BrowserFrame url="casaexemplo.prood.app">
            <Photo slug="product-bowls" sizes="40rem" className="aspect-[16/9] rounded-none" position="50% 60%" />
          </BrowserFrame>
          <CheckoutSample className="mx-auto w-56" />
        </div>
      </Block>

      <Block id="photo-title" eyebrow="Photography" title="One grade, many shops." intro="Real hands and faces in natural light. One warm, slightly matte grade, the same for stills and film. People shown are not customers.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {film.map((slug) => (
            <li key={slug}>
              <Photo slug={slug} sizes="(min-width: 640px) 40vw, 90vw" className="aspect-[4/5] rounded-xl" />
            </li>
          ))}
        </ul>
      </Block>
    </>
  )
}
