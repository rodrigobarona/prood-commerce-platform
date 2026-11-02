import { Suspense } from "react"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { Logo } from "@prood/ui/components/logo"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { FormPanelSkeleton } from "@/components/skeletons"
import { Status } from "@prood/ui/components/status-badge"
import { formatDateTime, humanize } from "@/lib/format"
import { approvalStatus } from "@/lib/status"
import { ApprovalControls } from "./approval-controls"
import { getApprovalRequest } from "./approval"

export const metadata = { title: "Approve AI agent access" }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default function AgentCapabilityApprovalPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <Link href="/" aria-label="Prood, go to your dashboard" className="w-fit">
        <Logo className="h-7" title={null} />
      </Link>
      <PageHeader
        title="Approve AI agent access"
        description="An AI agent is asking to work on your store. You approve or deny this request as a whole. Approved access ends after an hour idle, or 24 hours at most."
      />
      <Suspense fallback={<FormPanelSkeleton fields={4} />}>
        <ApprovalRequest searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function ApprovalRequest({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const requestId = typeof params.request_id === "string" ? params.request_id : null

  if (!requestId) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">
          There&apos;s no request to review. Start from the AI agent that asked for access, and it will send you back
          here.
        </p>
      </Panel>
    )
  }

  const details = await getApprovalRequest(requestId).catch((error: unknown) => {
    unstable_rethrow(error)
    console.error("[AgentCapabilityApprovalPage] getApprovalRequest failed:", error)
    return { error: "We couldn't load this request. Refresh the page to try again." }
  })

  if (!details) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find this request. It may have been handled already. Ask the AI agent to start again.
        </p>
      </Panel>
    )
  }

  if ("error" in details) {
    return (
      <Panel>
        <p role="alert" className="text-sm text-destructive">
          {details.error}
        </p>
      </Panel>
    )
  }

  return (
    <>
      <Panel title={details.agent.name} actions={<Status look={approvalStatus(details.status)} />}>
        <div className="flex flex-col gap-4">
          <FactList>
            <Fact label="Request">
              <span className="font-mono text-xs break-all">{details.id}</span>
            </Fact>
            <Fact label="Agent mode">{humanize(details.agent.mode)}</Fact>
            <Fact label="Agent status">{humanize(details.agent.status)}</Fact>
            <Fact label="Host">{details.host?.name ?? details.host?.id ?? "Unknown host"}</Fact>
            <Fact label="Expires">{formatDateTime(details.expiresAt)}</Fact>
          </FactList>
          {details.bindingMessage ? (
            <p className="rounded-lg bg-muted p-3 text-sm">{details.bindingMessage}</p>
          ) : null}
        </div>
      </Panel>

      <Panel title="What it's asking for" flush>
        {details.capabilities.length > 0 ? (
          <ul className="divide-y divide-border">
            {details.capabilities.map((capability) => (
              <li key={capability} className="px-5 py-3 font-mono text-xs">
                {capability}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground">This request doesn&apos;t ask for anything.</p>
        )}
      </Panel>

      {details.status === "pending" ? <ApprovalControls requestId={requestId} /> : null}
    </>
  )
}
