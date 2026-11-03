import { Suspense, type ReactNode } from "react"
import { ArrowSquareOut, Check, Minus } from "@phosphor-icons/react/dist/ssr"
import { getEntitlements } from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import { requiredEnv } from "@prood/types"

import { PlanCheckout } from "@/components/billing/plan-checkout"
import { UsageMeters } from "@/components/billing/usage-meters"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { BillingSkeleton } from "@/components/skeletons"
import { getDashboardStats, listOrders } from "@/lib/admin-api"
import {
  billingMode,
  canBuyPlans,
  countTeamSeats,
  getActiveOrganizationPlan,
  type BillingMode,
  type OrganizationPlanSnapshot,
} from "@/lib/billing"
import { listDomains } from "@/lib/domains"
import { planUsage } from "@/lib/plan-usage"
import { planStatus } from "@/lib/status"
import { isVercelConfigured } from "@/lib/vercel"

const webUrl = requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL")

export const metadata = { title: "Billing" }

type SearchParams = Promise<{ checkout?: string | string[] }>

export default function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <DashboardFormPage>
      <PageHeader title="Billing" description="Your Prood plan, and how much of it your store is using." />
      <Suspense fallback={<BillingSkeleton />}>
        <BillingContent searchParams={searchParams} />
      </Suspense>
    </DashboardFormPage>
  )
}

function monthStart(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

const endDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

function planDescription(plan: OrganizationPlanSnapshot | null, canBuy: boolean, mode: BillingMode | null): ReactNode {
  const managed = !!plan?.subscribed && canBuy
  if (plan?.planStatus === "past_due") {
    return managed
      ? "A payment on this plan failed. Update your card in Manage billing, and Stripe tries again."
      : "A payment on this plan is overdue. Your store's owner can sort it out, or email hello@prood.com."
  }
  if (plan?.endsAt) return `Cancelled. Your plan ends on ${endDate.format(plan.endsAt)}, then the store moves to Free.`
  if (!plan?.subscribed) return "Nothing is charged today."
  return mode === "test" ? "Billed monthly in Stripe test mode. No real money moves." : "Billed monthly, in euros."
}

/** Stripe's test card. Any future expiry date, any CVC and any postcode work with it. */
function TestModeNote() {
  return (
    <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Test mode.</span> Only platform admins see this. Pay with card{" "}
      <span className="font-mono text-foreground tabular-nums">4242 4242 4242 4242</span>, any future date and any CVC.
      No real money moves.
    </p>
  )
}

function PlanLine({ included, children }: { included: boolean; children: ReactNode }) {
  const Icon = included ? Check : Minus
  return (
    <li className={included ? "flex items-center gap-2" : "flex items-center gap-2 text-muted-foreground"}>
      <Icon weight="bold" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {children}
    </li>
  )
}

async function loadCounts(orgId: string) {
  const [stats, orders, teamSeats, domains] = await Promise.all([
    getDashboardStats(),
    listOrders({ dateFrom: monthStart(new Date()), perPage: 1 }),
    countTeamSeats(orgId),
    isVercelConfigured() ? listDomains(orgId) : null,
  ])
  return {
    products: stats.totalProducts,
    ordersThisMonth: orders.total,
    teamSeats,
    customDomains: domains?.length ?? null,
  }
}

async function BillingContent({ searchParams }: { searchParams: SearchParams }) {
  const { checkout } = await searchParams
  const mode = billingMode()
  let plan: Awaited<ReturnType<typeof getActiveOrganizationPlan>> = null
  let counts: Awaited<ReturnType<typeof loadCounts>> | null = null
  let canBuy = false
  try {
    ;[plan, canBuy] = await Promise.all([getActiveOrganizationPlan(), canBuyPlans(mode)])
    if (plan) counts = await loadCounts(plan.organizationId)
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
  }
  const planName = plan?.planName ?? "Free"
  const limits = getEntitlements(plan?.planId ?? "free")
  // Back from Stripe before its webhook has moved the plan. Hiding the plans meanwhile stops a second subscription.
  const awaitingPlan = checkout === "success" && !plan?.subscribed

  return (
    <>
      <Panel
        title={`${planName} plan`}
        description={planDescription(plan, canBuy, mode)}
        actions={plan?.planStatus ? <Status look={planStatus(plan.planStatus)} /> : undefined}
      >
        {awaitingPlan ? (
          <p className="mb-4 text-sm text-muted-foreground">
            If you&apos;ve just paid, your new plan shows here within a minute. Refresh the page if it doesn&apos;t.
          </p>
        ) : null}
        {counts ? (
          <UsageMeters rows={planUsage(limits, counts)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your usage. Refresh the page to try again.
          </p>
        )}
      </Panel>

      {canBuy && plan && !awaitingPlan ? (
        <Panel
          title={plan.subscribed ? "Your subscription" : "Choose a plan"}
          description={plan.subscribed ? undefined : "Billed monthly, in euros. Cancel any time."}
        >
          <div className="flex flex-col gap-4">
            {mode === "test" ? <TestModeNote /> : null}
            <PlanCheckout
              organizationId={plan.organizationId}
              currentPlanId={plan.planId}
              subscribed={plan.subscribed}
              hasBillingHistory={plan.hasBillingHistory}
            />
          </div>
        </Panel>
      ) : null}

      <Panel title="Also on your plan">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            <PlanLine included>
              {limits.apiWriteEnabled ? "REST API and MCP, read and write" : "Storefront API and MCP: browse products, fill a cart and place an order"}
            </PlanLine>
            <PlanLine included={limits.agentAuthEnabled}>
              {limits.agentAuthEnabled ? "Agent Auth included" : "Agent Auth starts on Grow"}
            </PlanLine>
          </ul>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button asChild variant="outline">
              <a href={`${webUrl}/pricing`} target="_blank" rel="noopener noreferrer">
                <span>Compare plans</span>
                <ArrowSquareOut aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
            {canBuy ? null : (
              <p className="text-sm text-muted-foreground">
                Paid plans can&apos;t be bought yet. To ask about one, email{" "}
                <a href="mailto:hello@prood.com" className="text-foreground underline underline-offset-4">
                  hello@prood.com
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </Panel>
    </>
  )
}
