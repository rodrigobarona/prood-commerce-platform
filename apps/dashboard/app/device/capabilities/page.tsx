import { DashboardFormPage } from "@/components/layout/dashboard-page"

export const metadata = { title: "Agent capability approval" }

export default async function AgentCapabilityApprovalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestId = typeof params.request_id === "string" ? params.request_id : null

  return (
    <DashboardFormPage>
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="font-heading text-xl font-medium">Agent capability approval</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve delegated agent capabilities for the active organization.
          </p>
        </div>

        <div className="rounded-2xl border p-4 text-sm">
          {requestId ? (
            <p>
              Approval request <code className="rounded bg-muted px-1">{requestId}</code>{" "}
              was received. Complete the approval in the Agent Auth flow.
            </p>
          ) : (
            <p>
              No approval request was provided. Start from an agent registration flow to
              review requested capabilities.
            </p>
          )}
        </div>
      </div>
    </DashboardFormPage>
  )
}
