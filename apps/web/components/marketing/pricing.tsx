import { CheckIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr"
import { Fragment } from "react"

import {
  getMarketingTier,
  planIds,
  planSlipLines,
  pricingFeatureGroups,
  pricingFeatureRows,
} from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { Receipt } from "@prood/ui/components/receipt"
import { contactHref, siteConfig } from "@/lib/site"

/** The bar the slips hang from. */
function Rail() {
  return <div aria-hidden className="relative z-10 h-2.5 rounded-full bg-foreground" />
}

/** Slips hang side by side, so each casts a short shadow. */
const SLIP = "max-w-none drop-shadow-md drop-shadow-ink/15"

/** A paid slip says it can't be bought, and the Agency slip says what to do instead. */
function PaidFooter({ id }: { id: string }) {
  return id === "agency" ? (
    <>
      Can&apos;t be bought yet. Running several client stores?{" "}
      <a href={contactHref("Several client stores")} className="underline underline-offset-2">
        Email us
      </a>
      .
    </>
  ) : (
    "Can't be bought yet."
  )
}

/** Free is the one thing you can act on today. The rest hang beside it, marked as coming. */
export function PricingPlans() {
  return (
    <div>
      <Rail />
      <ul className="-mt-1 grid items-start gap-x-4 gap-y-8 px-2 md:grid-cols-2 xl:grid-cols-4">
        {planIds.map((id) => {
          const tier = getMarketingTier(id)
          const free = id === "free"
          return (
            <li key={id}>
              <Receipt
                className={SLIP}
                heading={<span className="font-heading text-2xl tracking-[-0.01em]">{tier.name}</span>}
                meta={free ? <span className="invisible">Coming</span> : "Coming"}
                lines={[
                  ...planSlipLines(id),
                  { label: free ? "To pay" : "Planned price", value: `${tier.price} ${tier.period}`, total: true },
                ]}
                footer={free ? "Every store starts here." : <PaidFooter id={id} />}
              >
                {free ? (
                  <Button variant="brand" size="lg" className="mt-4 h-10 w-full font-sans" asChild>
                    <a href={siteConfig.registerUrl}>Start free</a>
                  </Button>
                ) : null}
              </Receipt>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Compact plan slips for the home page. */
export function PricingSummary() {
  return (
    <div>
      <Rail />
      <ul className="-mt-1 grid items-start gap-x-4 gap-y-8 px-2 sm:grid-cols-2 lg:grid-cols-4">
        {planIds.map((id) => {
          const tier = getMarketingTier(id)
          const free = id === "free"
          return (
            <li key={id}>
              <Receipt
                className={SLIP}
                heading={<span className="font-heading text-2xl tracking-[-0.01em]">{tier.name}</span>}
                meta={free ? <span className="invisible">Coming</span> : "Coming"}
                lines={[
                  ...planSlipLines(id).slice(0, 4),
                  { label: free ? "To pay" : "Planned price", value: `${tier.price} ${tier.period}`, total: true },
                ]}
              />
            </li>
          )
        })}
      </ul>
    </div>
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
  const tiers = planIds.map((id) => getMarketingTier(id))

  return (
    <div
      role="region"
      tabIndex={0}
      aria-label="Plan limits and features compared. Scroll sideways for every plan."
      className="scroll-cue overflow-x-auto rounded-xl border border-border bg-card"
    >
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
