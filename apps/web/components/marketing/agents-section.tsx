import Link from "next/link"

import { MockFrame } from "@/components/marketing/mocks/mock-chrome"
import { AgentAuthMock } from "@/components/marketing/mocks/agent-auth-mock"
import { SplitShowcase } from "@/components/marketing/split-showcase"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { agentExamples } from "@/lib/site"

export function AgentsSection({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <SectionShell id="agents">
        <SectionContainer className="py-16 md:py-20">
          <SplitShowcase
            reverse
            eyebrow="AI & automation"
            title="Let assistants help—after you approve"
            description="On Grow and above, agents use the same API as your team. Sensitive changes wait for your sign-off."
            visual={<AgentAuthMock />}
          >
            <ul className="space-y-3 marketing-copy">
              {agentExamples.map((ex) => (
                <li key={ex.title}>
                  <span className="font-medium text-foreground">{ex.title}.</span> {ex.description}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/ai">How AI works on Prood</Link>
              </Button>
            </div>
          </SplitShowcase>
        </SectionContainer>
      </SectionShell>
    )
  }

  return (
    <SectionShell id="agents" variant="muted">
      <SectionContainer>
        <SectionHeader
          eyebrow="AI & automation"
          title="Humans and agents, same store"
          description="REST, MCP, and Agent Auth on Grow and above—scoped per store, with approval before anything critical changes."
        />
        <div className="mt-12 max-w-xl">
          <MockFrame>
            <AgentAuthMock className="shadow-none" />
          </MockFrame>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
