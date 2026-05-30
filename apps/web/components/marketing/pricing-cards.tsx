import { Fragment } from "react"
import Link from "next/link"
import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr"

import { BentoCell, BentoGrid } from "@/components/marketing/bento-grid"
import { Button } from "@/components/ui/button"
import {
  getPricingFeatureGroupLabel,
  pricingFeatureRows,
  type MarketingTier,
  type PlanId,
  type PricingFeatureGroup,
} from "@/lib/pricing"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

function tierCtaHref(tier: MarketingTier): string {
  if (tier.ctaHref === "contact") return "mailto:hello@prood.com"
  return siteConfig.registerUrl
}

export function PricingTierCard({ tier }: { tier: MarketingTier }) {
  return (
    <BentoCell
      accent={tier.highlighted}
      className={cn("flex flex-col", tier.highlighted && "outline outline-1 outline-foreground/15")}
    >
      {tier.badge ? (
        <span className="marketing-badge mb-4 w-fit py-1 text-[10px] font-semibold tracking-wide text-brand uppercase">
          <span className="marketing-badge-dot" aria-hidden />
          {tier.badge}
        </span>
      ) : null}
      <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-balance">{tier.name}</h3>
      <p className="mt-2 flex flex-wrap items-baseline gap-1">
        <span className="font-display text-[32px] font-medium tracking-[-0.04em]">{tier.price}</span>
        <span className="text-[13px] text-muted-foreground">{tier.period}</span>
      </p>
      {tier.annualNote ? (
        <p className="mt-1 font-mono text-[11px] text-brand">{tier.annualNote}</p>
      ) : null}
      <p className="marketing-copy mt-3">{tier.description}</p>
      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.highlights.map((item) => (
          <li key={item} className="flex gap-2 text-[13px]">
            <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-brand" weight="bold" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <Button className="mt-8 w-full" variant={tier.highlighted ? "brand" : "outline"} asChild>
        <Link href={tierCtaHref(tier)}>{tier.cta}</Link>
      </Button>
    </BentoCell>
  )
}

export function PricingCardsGrid({ tiers }: { tiers: MarketingTier[] }) {
  const count = tiers.length
  return (
    <BentoGrid
      className={cn(
        "grid-cols-1",
        count === 3 && "lg:grid-cols-3",
        count === 4 && "md:grid-cols-2 lg:grid-cols-4",
        count === 1 && "max-w-md mx-auto"
      )}
    >
      {tiers.map((tier) => (
        <PricingTierCard key={tier.id} tier={tier} />
      ))}
    </BentoGrid>
  )
}

export function PricingFreeBand({ tier }: { tier: MarketingTier }) {
  return (
    <div className="marketing-panel p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-medium tracking-wide text-brand uppercase">
            Free forever
          </p>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-balance">
            {tier.name} — {tier.price} {tier.period}
          </h3>
          <p className="marketing-copy mt-2">{tier.description}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {tier.highlights.map((item) => (
              <li key={item} className="flex gap-2 text-[13px]">
                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-brand" weight="bold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button className="shrink-0" variant="outline" size="lg" asChild>
          <Link href={siteConfig.registerUrl}>{tier.cta}</Link>
        </Button>
      </div>
    </div>
  )
}

const featureGroups: PricingFeatureGroup[] = [
  "store",
  "catalog",
  "brand",
  "team",
  "ai",
  "support",
]

export function PricingComparisonTable() {
  const columns: PlanId[] = ["free", "grow", "scale", "agency"]

  return (
    <div className="geo-frame overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              <th className="py-4 pr-4 pl-6 font-medium text-muted-foreground">Feature</th>
              {columns.map((id) => (
                <th key={id} className="px-4 py-4 font-semibold capitalize">
                  {id === "agency" ? "Agency" : id.charAt(0).toUpperCase() + id.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureGroups.map((group) => {
              const rows = pricingFeatureRows.filter((r) => r.group === group)
              if (rows.length === 0) return null
              return (
                <Fragment key={group}>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td
                      colSpan={5}
                      className="py-2.5 pr-4 pl-6 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                    >
                      {getPricingFeatureGroupLabel(group)}
                    </td>
                  </tr>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-b border-border/40",
                        rowIndex % 2 === 0 ? "bg-background/80" : "bg-muted/10"
                      )}
                    >
                      <td className="py-3.5 pr-4 pl-6 text-muted-foreground">{row.label}</td>
                      {columns.map((id) => (
                        <td key={id} className="px-4 py-3.5">
                          <CellValue value={row[id]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckIcon className="size-4 text-brand" weight="bold" aria-label="Included" />
    ) : (
      <XIcon className="size-4 text-muted-foreground/60" weight="bold" aria-label="Not included" />
    )
  }
  return <span>{value}</span>
}
