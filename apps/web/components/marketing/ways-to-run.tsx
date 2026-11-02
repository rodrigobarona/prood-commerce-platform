import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { KeyMark } from "@prood/ui/components/key-mark"
import { Receipt } from "@prood/ui/components/receipt"
import { TileEdge } from "@prood/ui/components/tile"
import { CodeWindow } from "@/components/marketing/code-window"
import { Container, Eyebrow, Photo } from "@/components/marketing/section"
import { docsPage } from "@/lib/site"

const LINK = "mt-auto inline-flex items-center gap-1.5 self-start rounded-sm pt-4 text-sm font-medium underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"

function Bay({
  who,
  title,
  view,
  children,
}: {
  who: string
  title: string
  view: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex min-w-0 flex-col border-border p-5 not-first:border-t sm:p-7 lg:not-first:border-t-0 lg:not-first:border-l">
      <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-xl">{view}</div>
      <p className="mt-6 text-sm text-muted-foreground">{who}</p>
      <h3 className="mt-1 text-display-sm">{title}</h3>
      {children}
    </li>
  )
}

/** One store, three ways to run it: by hand, by code or with an AI agent. */
export function WaysToRun() {
  return (
    <section aria-labelledby="ways-title" className="bg-muted py-20 md:py-32">
      <Container>
        <div className="grid gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <div>
            <Eyebrow>One store, three ways to run it</Eyebrow>
            <h2 id="ways-title" className="mt-4 text-display-md">
              By hand, by code or with an AI agent.
            </h2>
          </div>
          <p className="text-lead text-muted-foreground lg:pt-8">
            Catalog, orders, customers, inventory and store settings all run on /v1, the same calls the dashboard makes.
            Paid plans can&apos;t be bought yet, so today you run a store in the dashboard.
          </p>
        </div>
        <div className="surface-ink mt-14 overflow-hidden rounded-3xl md:mt-20">
          <p className="px-5 py-5 text-center font-heading text-2xl tracking-[-0.006em] text-paper sm:text-3xl">Your store</p>
          <TileEdge awning className="text-ink" />
          <ul className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-3">
            <Bay
              who="For merchants"
              title="By hand"
              view={<Photo slug="parcel-twine" sizes="(min-width: 1024px) 33vw, 100vw" position="50% 62%" className="size-full rounded-xl" />}
            >
              <p className="mt-2 leading-7 text-muted-foreground">
                Add products, take orders, and connect payments and domains in the dashboard. No plugins to install first.
              </p>
              <a href={docsPage("guides/for-merchants")} className={LINK}>
                Read the merchant guide
                <ArrowRightIcon className="size-4" aria-hidden />
              </a>
            </Bay>
            <Bay
              who="For developers"
              title="By code"
              view={
                <CodeWindow
                  title="zsh"
                  className="w-full"
                  lines={[
                    { text: "# List the store's products", tone: "comment" },
                    { text: "curl \\", tone: "command" },
                    { text: "  https://api.prood.com/v1/products \\", tone: "command" },
                    { text: '  -H "x-api-key: $PROOD_API_KEY"', tone: "command" },
                  ]}
                />
              }
            >
              <p className="mt-2 leading-7 text-muted-foreground">
                More than 40 REST operations, an OpenAPI 3.1 spec, a TypeScript client and the prood CLI, both available
                from the source repo for now. Free keys reach the public storefront API. Admin calls start on Grow.
              </p>
              <Link href="/developers" className={LINK}>
                Build on Prood
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </Bay>
            <Bay
              who="For AI agents"
              title="With an AI agent"
              view={
                <>
                  <KeyMark className="absolute top-4 left-4 w-20 -rotate-6 text-telha" />
                  <Receipt
                    className="max-w-64 rotate-1"
                    meta="Example, with Agent Auth"
                    lines={[
                      { label: "Not approved", value: "Nothing" },
                      { label: "Approved", value: "Public catalog" },
                      { label: "Anything else", value: "Asks you", highlight: true },
                    ]}
                  />
                </>
              }
            >
              <p className="mt-2 leading-7 text-muted-foreground">
                Agent Auth lets an AI agent ask for access to your store, and you decide. Agent Auth is coming with Grow.
              </p>
              <Link href="/developers" className={LINK}>
                See how approval works
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </Bay>
          </ul>
        </div>
      </Container>
    </section>
  )
}
