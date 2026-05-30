import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { pillars } from "@/lib/site"

export function PillarsSection() {
  return (
    <SectionShell>
      <SectionContainer>
        <SectionHeader
          align="center"
          eyebrow="Why Prood"
          title="Launch, run, and grow on one platform"
          description="Everything you need to sell online—without assembling checkout, admin, and domains from separate vendors."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className="marketing-panel marketing-panel-interactive p-6 md:p-7"
            >
              <span className="geo-step-index mb-5" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="marketing-heading">{pillar.title}</h3>
              <p className="marketing-copy mt-3">{pillar.description}</p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
