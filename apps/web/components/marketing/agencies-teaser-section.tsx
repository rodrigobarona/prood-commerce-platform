import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"

import { MockFrame } from "@/components/marketing/mocks/mock-chrome"
import { MultiStoreMock } from "@/components/marketing/mocks/multi-store-mock"
import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { Button } from "@/components/ui/button"
import { agencyHighlights } from "@/lib/site"

export function AgenciesTeaserSection() {
  return (
    <SectionShell variant="muted">
      <SectionContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="For agencies"
              title="Every client gets a real store"
              description="Spin up isolated tenants with their own catalog, payments, and domain—without rebuilding checkout for each project."
            />
            <ul className="mt-8 space-y-4">
              {agencyHighlights.map((item) => (
                <li key={item.title} className="marketing-copy">
                  <span className="font-medium text-foreground">{item.title}.</span> {item.description}
                </li>
              ))}
            </ul>
            <Button className="mt-8" variant="brand" asChild>
              <Link href="/agencies">
                Agency plans
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>
          <MockFrame>
            <MultiStoreMock className="shadow-none" />
          </MockFrame>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
