import { CodeIcon, RobotIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr"

import { Section, SectionHeading } from "@/components/marketing/section"

const ways = [
  {
    icon: StorefrontIcon,
    audience: "For merchants",
    title: "The dashboard",
    body: "Add products, take orders, connect payments and domains, and invite your team. No plugins to install first.",
  },
  {
    icon: CodeIcon,
    audience: "For developers",
    title: "The API and CLI",
    body: "More than 40 REST operations under /v1, an OpenAPI 3.1 spec, a TypeScript client and the prood CLI.",
  },
  {
    icon: RobotIcon,
    audience: "For AI agents",
    title: "MCP and Agent Auth",
    body: "40 MCP tools on the same API. Agents can read on their own; anything that changes your store needs your approval first.",
  },
] as const

export function WaysToRun() {
  return (
    <Section labelledBy="ways-title">
      <SectionHeading
        id="ways-title"
        eyebrow="One store, three ways in"
        title="Run it by hand, by code or with an agent."
        description="The dashboard, the API and AI agents all work on the same store through the same API. Nothing is a bolt-on."
      />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {ways.map(({ icon: Icon, audience, title, body }) => (
          <li key={title} className="bg-card p-7 md:p-8">
            <Icon className="size-7 text-brand" aria-hidden />
            <p className="mt-6 text-sm text-muted-foreground">{audience}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.015em]">{title}</h3>
            <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
