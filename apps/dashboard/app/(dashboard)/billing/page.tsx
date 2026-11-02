import { Suspense, type ReactNode } from "react"
import { ArrowSquareOut, Check, Minus } from "@phosphor-icons/react/dist/ssr"
import { getEntitlements } from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import { requiredEnv } from "@prood/types"

import { UsageMeters } from "@/components/billing/usage-meters"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { BillingSkeleton } from "@/components/skeletons"
import { getDashboardStats, listOrders } from "@/lib/admin-api"
import { countTeamSeats, getActiveOrganizationPlan } from "@/lib/billing"
import { listDomains } from "@/lib/domains"
import { planUsage } from "@/lib/plan-usage"
import { planStatus } from "@/lib/status"
import { isVercelConfigured } from "@/lib/vercel"

const webUrl = requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL")

export const metadata = { title: "Billing" }

export default function BillingPage() {
  return (
    <DashboardFormPage>
      <PageHeader title="Billing" description="Your Prood plan, and how much of it your store is using." />
      <Suspense fallback={<BillingSkeleton />}>
        <BillingContent />
      </Suspense>
    </DashboardFormPage>
  )
}

function monthStart(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

/** Plans are handled by hand for now, so a late payment gets sorted out over email. */
function planDescription(status: string | undefined): ReactNode {
  if (status !== "past_due") return "Nothing is charged today."
  return (
    <>
      A payment on this plan is overdue. To sort it out, email{" "}
      <a href="mailto:hello@prood.com" className="text-foreground underline underline-offset-4">
        hello@prood.com
      </a>
      .
    </>
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

async function BillingContent() {
  let plan: Awaited<ReturnType<typeof getActiveOrganizationPlan>> = null
  let counts: Awaited<ReturnType<typeof loadCounts>> | null = null
  try {
    plan = await getActiveOrganizationPlan()
    if (plan) counts = await loadCounts(plan.organizationId)
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
  }
  const planName = plan?.planName ?? "Free"
  const limits = getEntitlements(plan?.planId ?? "free")

  return (
    <>
      <Panel
        title={`${planName} plan`}
        description={planDescription(plan?.planStatus)}
        actions={plan?.planStatus ? <Status look={planStatus(plan.planStatus)} /> : undefined}
      >
        {counts ? (
          <UsageMeters rows={planUsage(limits, counts)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your usage. Refresh the page to try again.
          </p>
        )}
      </Panel>

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
            <p className="text-sm text-muted-foreground">
              Paid plans can&apos;t be bought yet. To ask about one, email{" "}
              <a href="mailto:hello@prood.com" className="text-foreground underline underline-offset-4">
                hello@prood.com
              </a>
              .
            </p>
          </div>
        </div>
      </Panel>
    </>
  )
}
