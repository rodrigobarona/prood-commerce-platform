import Link from "next/link"
import { Receipt } from "@phosphor-icons/react/dist/ssr"

import { getPlanLimitsSummary, getActiveOrganizationPlan } from "@/lib/billing"
import { DashboardEmpty } from "@/components/dashboard-empty"

const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"

export const metadata = { title: "Billing" }

export default async function BillingPage() {
  const plan = await getActiveOrganizationPlan()
  const planName = plan?.planName ?? "Free"
  const limits = getPlanLimitsSummary(plan?.planId ?? "free")

  return (
    <DashboardEmpty
      icon={Receipt}
      title="Billing"
      description="Manage your platform subscription and payment method."
      contentClassName="max-w-lg items-stretch"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
          <p>
            You are on the <strong className="text-foreground">{planName}</strong> plan
            {plan?.planStatus && plan.planStatus !== "active" ? (
              <> ({plan.planStatus})</>
            ) : null}
            . Subscription billing is coming soon—you can use all features while limits are
            rolled out.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-[13px]">
            {limits.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`${webUrl}/pricing`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View plans and pricing
          </Link>
        </p>
      </div>
    </DashboardEmpty>
  )
}
