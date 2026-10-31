import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { CodeWindow } from "@/components/marketing/code-window"
import { Section, SectionHeading } from "@/components/marketing/section"
import { siteConfig } from "@/lib/site"

export function DevelopersTeaser() {
  return (
    <Section labelledBy="developers-title" inverted>
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            id="developers-title"
            eyebrow="API-first"
            title="The dashboard uses the same API you do."
            description="Everything a merchant can do by hand, your code can do through /v1. Use an organization API key from your scripts, or let an agent sign in with Agent Auth."
          />
          <div className="mt-9 flex flex-wrap gap-3">
            <Button variant="brand" size="lg" className="h-11 px-5 text-base" asChild>
              <Link href="/developers">
                Prood for developers
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-11 px-5 text-base" asChild>
              <a href={siteConfig.apiReferenceUrl}>API reference</a>
            </Button>
          </div>
        </div>
        <CodeWindow
          title="zsh"
          lines={[
            { text: "# List this week's paid orders", tone: "comment" },
            { text: "curl https://api.prood.com/v1/admin/orders \\", tone: "command" },
            { text: '  -G -d status=paid -d dateFrom=2026-10-26 \\', tone: "command" },
            { text: '  -H "x-api-key: $PROOD_API_KEY"', tone: "command" },
            { text: "" },
            { text: "# Or hand the same API to an MCP client", tone: "comment" },
            { text: "prood mcp config --api-url https://api.prood.com/v1", tone: "command" },
            { text: '{ "mcpServers": { "prood-commerce": {', tone: "output" },
            { text: '  "url": "https://api.prood.com/mcp", "headers": { … } } } }', tone: "output" },
          ]}
        />
      </div>
    </Section>
  )
}
