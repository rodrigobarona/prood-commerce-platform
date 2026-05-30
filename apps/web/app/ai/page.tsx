import type { Metadata } from "next"
import Link from "next/link"

import { AgentAuthMock } from "@/components/marketing/mocks/agent-auth-mock"
import { SplitShowcase } from "@/components/marketing/split-showcase"
import { CtaSection } from "@/components/marketing/cta-section"
import { MarketingCard, SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { Button } from "@/components/ui/button"
import { agentExamples, siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "AI & agents",
  description:
    "Approve AI assistants to work on your Prood store via Agent Auth and MCP—the same API as your dashboard, with sign-off before sensitive changes.",
}

const capabilities = [
  {
    title: "REST API",
    description: "Commerce operations at /v1/* with OpenAPI 3.1 docs—build what you need on top.",
  },
  {
    title: "MCP server",
    description: "Tools that mirror REST for Claude and compatible clients. One POST endpoint.",
  },
  {
    title: "Agent Auth",
    description:
      "Register agents, grant capabilities, and approve mutations. Discovery at /.well-known/agent-configuration.",
  },
] as const

export default function AiPage() {
  return (
    <MarketingPageShell>
      <SectionShell variant="glow">
        <SectionContainer className="pt-24 md:pt-32">
          <SplitShowcase
            eyebrow="AI & automation"
            title="Your store, assistant-ready"
            description="Prood is built for real commerce—not demos. Assistants can help with orders and catalog when you approve them. Available on Grow and above."
            visual={<AgentAuthMock />}
          >
            <div className="flex flex-wrap gap-3">
              <Button variant="brand" asChild>
                <Link href={siteConfig.registerUrl}>Start free</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`${siteConfig.docsUrl}/docs/apps/api/mcp`}>MCP docs</Link>
              </Button>
            </div>
          </SplitShowcase>
        </SectionContainer>
      </SectionShell>

      <SectionShell>
        <SectionContainer>
          <SectionHeader
            eyebrow="Capabilities"
            title="Pick how you integrate"
            description="Same data model and security no matter which surface you use."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {capabilities.map((cap) => (
              <MarketingCard key={cap.title} hover>
                <h3 className="marketing-heading-md">{cap.title}</h3>
                <p className="marketing-copy mt-2">{cap.description}</p>
              </MarketingCard>
            ))}
          </div>
        </SectionContainer>
      </SectionShell>

      <SectionShell variant="muted">
        <SectionContainer>
          <SectionHeader
            eyebrow="Examples"
            title="What you can delegate"
            description="Reads can be automatic. Writes wait for you."
          />
          <ul className="mt-10 space-y-6">
            {agentExamples.map((ex) => (
              <li key={ex.title} className="marketing-panel p-6">
                <h3 className="marketing-heading-md">{ex.title}</h3>
                <p className="marketing-copy mt-2">{ex.description}</p>
              </li>
            ))}
          </ul>
          <Button className="mt-8" variant="outline" asChild>
            <Link href={`${siteConfig.docsUrl}/docs/apps/api/agent-auth`}>Agent Auth guide</Link>
          </Button>
        </SectionContainer>
      </SectionShell>

      <CtaSection />
    </MarketingPageShell>
  )
}
