import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { Badge } from "@prood/ui/components/badge"
import { ApprovalControls } from "./approval-controls"
import { getApprovalRequest } from "./approval"

export const metadata = { title: "Agent capability approval" }

export default async function AgentCapabilityApprovalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestId = typeof params.request_id === "string" ? params.request_id : null
  const details = requestId
    ? await getApprovalRequest(requestId).catch((error: unknown) => {
        console.error("[AgentCapabilityApprovalPage] getApprovalRequest failed:", error)
        return { error: "Could not load approval request." }
      })
    : null

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
          {!requestId ? (
            <p>
              No approval request was provided. Start from an agent registration flow to
              review requested capabilities.
            </p>
          ) : details && "error" in details ? (
            <p className="text-destructive">{details.error}</p>
          ) : details ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{details.agent.name}</p>
                  <p className="text-muted-foreground">
                    Request <code className="rounded bg-muted px-1">{details.id}</code>
                  </p>
                </div>
                <Badge variant={details.status === "pending" ? "outline" : "secondary"}>
                  {details.status}
                </Badge>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Agent mode</dt>
                  <dd>{details.agent.mode}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Agent status</dt>
                  <dd>{details.agent.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Host</dt>
                  <dd>{details.host?.name ?? details.host?.id ?? "Unknown host"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd>{details.expiresAt.toLocaleString()}</dd>
                </div>
              </dl>

              {details.bindingMessage ? (
                <p className="rounded-xl bg-muted p-3">{details.bindingMessage}</p>
              ) : null}

              <div>
                <h3 className="font-medium">Requested capabilities</h3>
                {details.capabilities.length > 0 ? (
                  <ul className="mt-2 grid gap-2">
                    {details.capabilities.map((capability) => (
                      <li key={capability} className="rounded-xl border px-3 py-2">
                        <code>{capability}</code>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    This request does not include any capabilities.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Approval request not found.</p>
          )}
        </div>

        {requestId && details && !("error" in details) && details.status === "pending" ? (
          <ApprovalControls requestId={requestId} />
        ) : null}
      </div>
    </DashboardFormPage>
  )
}
