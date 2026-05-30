import { SectionContainer, SectionHeader, SectionShell } from "@/components/marketing/section"
import { merchantGainItems, merchantPainItems } from "@/lib/site"

export function MerchantPainSection() {
  return (
    <SectionShell variant="muted">
      <SectionContainer>
        <SectionHeader
          align="center"
          eyebrow="Time back to selling"
          title="Less setup. More revenue."
          description="Most platforms make you pay twice—once in subscriptions, again in fees and hours lost to configuration."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="marketing-panel p-6 md:p-8">
            <h3 className="marketing-heading-sm text-muted-foreground">The usual stack</h3>
            <ul className="marketing-list-divider mt-6">
              {merchantPainItems.map((item) => (
                <li key={item.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="marketing-heading-sm">{item.title}</p>
                    <p className="rounded-sm bg-destructive/8 px-2 py-0.5 font-mono text-[11px] text-destructive/90">
                      {item.timeCost}
                    </p>
                  </div>
                  <p className="marketing-copy mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="marketing-panel border-brand/20 bg-brand/5 p-6 md:p-8">
            <h3 className="marketing-heading-sm">With Prood</h3>
            <ul className="marketing-list-divider mt-6">
              {merchantGainItems.map((item) => (
                <li key={item.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="marketing-heading-sm">{item.title}</p>
                    <p className="rounded-sm bg-brand/12 px-2 py-0.5 font-mono text-[11px] text-brand">
                      {item.timeCost}
                    </p>
                  </div>
                  <p className="marketing-copy mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionContainer>
    </SectionShell>
  )
}
