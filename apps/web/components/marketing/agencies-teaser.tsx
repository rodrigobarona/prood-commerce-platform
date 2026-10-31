import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { Section, SectionHeading } from "@/components/marketing/section"

const clients = [
  { name: "Atelier Sol", host: "shop.atelier-sol.pt", provider: "Easypay" },
  { name: "Northbound Coffee", host: "northbound.prood.app", provider: "Stripe" },
  { name: "Casa Lume", host: "loja.casalume.pt", provider: "Ifthenpay" },
] as const

export function AgenciesTeaser() {
  return (
    <Section labelledBy="agencies-title">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading
            id="agencies-title"
            eyebrow="For agencies"
            title="Build stores for clients, not workarounds."
            description="Every client gets an isolated store with its own data, payment accounts and domain. Invite them in with their own login, and run up to 10 stores on the Agency plan."
          />
          <Button variant="outline" size="lg" className="mt-9 h-11 px-5 text-base" asChild>
            <Link href="/agencies">
              Prood for agencies
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <figure>
          <figcaption className="sr-only">
            Example: three client stores, each with its own domain and payment provider.
          </figcaption>
          <ul aria-hidden className="divide-y divide-border rounded-xl border border-border bg-card">
            {clients.map((client) => (
              <li key={client.name} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-sm font-semibold">
                  {client.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{client.name}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {client.host}
                  </span>
                </span>
                <span className="ml-auto rounded-md bg-muted px-2.5 py-1 text-xs">{client.provider}</span>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </Section>
  )
}
