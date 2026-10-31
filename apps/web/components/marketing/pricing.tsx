import { CheckIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr"
import { Fragment } from "react"

import {
  annualBillingDiscountPercent,
  getMarketingTier,
  planIds,
  pricingFeatureGroups,
  pricingFeatureRows,
  type MarketingTier,
} from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { cn } from "@prood/ui/lib/utils"
import { contactHref, siteConfig } from "@/lib/site"

function ctaHref(tier: MarketingTier) {
  return tier.ctaHref === "contact" ? contactHref(`${tier.name} plan`) : siteConfig.registerUrl
}

function Price({ tier, className }: { tier: MarketingTier; className?: string }) {
  return (
    <div className={className}>
      <p className="flex items-baseline gap-1.5">
        <span className="font-heading text-4xl font-semibold tracking-[-0.03em] tabular-nums">
          {tier.price}
        </span>
        <span className="text-sm text-muted-foreground">{tier.period}</span>
      </p>
      <p className="mt-1 h-5 text-sm text-muted-foreground">{tier.billingNote}</p>
    </div>
  )
}

/**
 * Plan cards with a monthly/yearly switch built from radio inputs and
 * `:has()`, so the page stays a Server Component and works without JS.
 */
export function PricingPlans() {
  return (
    <div className="group/plans">
      <fieldset className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
        <legend className="sr-only">Billing period</legend>
        {(["monthly", "annual"] as const).map((interval) => (
          <label
            key={interval}
            className="relative cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name="billing-period"
              value={interval}
              defaultChecked={interval === "monthly"}
              className="sr-only"
            />
            {interval === "monthly" ? "Monthly" : `Yearly, save ${annualBillingDiscountPercent}%`}
          </label>
        ))}
      </fieldset>

      <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planIds.map((id) => {
          const monthly = getMarketingTier(id, "monthly")
          const annual = getMarketingTier(id, "annual")
          return (
            <li
              key={id}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6",
                monthly.highlighted ? "border-foreground shadow-[0_0_0_1px_var(--foreground)]" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{monthly.name}</h3>
                {monthly.badge ? (
                  <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand-subtle-foreground">
                    {monthly.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[0.9375rem] leading-6 text-muted-foreground md:min-h-18">
                {monthly.description}
              </p>
              <Price tier={monthly} className="mt-6 group-has-[input[value=annual]:checked]/plans:hidden" />
              <Price tier={annual} className="mt-6 hidden group-has-[input[value=annual]:checked]/plans:block" />
              <Button
                variant={monthly.highlighted ? "brand" : "outline"}
                size="lg"
                className="mt-6 h-10 w-full"
                asChild
              >
                <a href={ctaHref(monthly)}>{monthly.cta}</a>
              </Button>
              <ul className="mt-6 space-y-2.5 border-t border-border pt-6">
                {monthly.highlights.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[0.9375rem]">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-brand" weight="bold" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Compact plan strip for the home page. */
export function PricingSummary() {
  return (
    <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {planIds.map((id) => {
        const tier = getMarketingTier(id, "monthly")
        return (
          <li key={id} className="bg-card p-6">
            <h3 className="font-sans text-base font-semibold">{tier.name}</h3>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="font-heading text-3xl font-semibold tracking-[-0.03em] tabular-nums">
                {tier.price}
              </span>
              <span className="text-sm text-muted-foreground">{tier.period}</span>
            </p>
            <p className="mt-3 text-[0.9375rem] leading-6 text-muted-foreground">{tier.description}</p>
          </li>
        )
      })}
    </ul>
  )
}

function Cell({ value, plan }: { value: string | boolean; plan: string }) {
  if (value === true) {
    return <CheckIcon className="size-4 text-brand" weight="bold" aria-label={`Included in ${plan}`} />
  }
  if (value === false) {
    return (
      <MinusIcon className="size-4 text-muted-foreground" aria-label={`Not included in ${plan}`} />
    )
  }
  return <span className="tabular-nums">{value}</span>
}

export function PricingTable() {
  const tiers = planIds.map((id) => getMarketingTier(id, "monthly"))

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[42rem] border-collapse text-left text-[0.9375rem]">
        <caption className="sr-only">Plan limits and features compared</caption>
        <thead>
          <tr className="border-b border-border">
            <td className="w-[32%] px-5 py-4" />
            {tiers.map((tier) => (
              <th key={tier.id} scope="col" className="px-4 py-4 font-heading text-base font-semibold">
                {tier.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pricingFeatureGroups.map((group) => (
            <Fragment key={group.id}>
              <tr className="bg-muted/60">
                <th
                  scope="colgroup"
                  colSpan={tiers.length + 1}
                  className="px-5 py-2.5 font-mono text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
                >
                  {group.label}
                </th>
              </tr>
              {pricingFeatureRows
                .filter((row) => row.group === group.id)
                .map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <th scope="row" className="px-5 py-3.5 font-normal text-muted-foreground">
                      {row.label}
                    </th>
                    {tiers.map((tier) => (
                      <td key={tier.id} className="px-4 py-3.5">
                        <Cell value={row[tier.id]} plan={tier.name} />
                      </td>
                    ))}
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
