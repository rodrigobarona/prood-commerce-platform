import { Suspense } from "react"
import { unstable_rethrow } from "next/navigation"
import { ArrowSquareOut, Key, Robot } from "@phosphor-icons/react/dist/ssr"
import { getEntitlements } from "@prood/billing"
import { Button } from "@prood/ui/components/button"
import { CopyBlock } from "@prood/ui/components/copy-block"
import { ListTable } from "@prood/ui/components/list-table"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { Status } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { DashboardFormPage, DashboardPage } from "@/components/layout/dashboard-page"
import { PageSkeleton } from "@/components/skeletons"
import { canManageStore } from "@/lib/admin"
import { listOrgApiKeys } from "@/lib/api-keys"
import { listStoreAgentEvents, listStoreAgents, type StoreAgentEvent } from "@/lib/agents"
import { getActiveOrganizationPlan } from "@/lib/billing"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { agentStatus, apiKeyStatus } from "@/lib/status"
import { ApiKeyCreateForm } from "./api-key-create-form"
import { RevokeKeyButton } from "./revoke-key-button"
import { RevokeAgentButton } from "./revoke-agent-button"
import { changesStore } from "@prood/auth/agent-capabilities"
import { requiredEnv } from "@prood/types"

export const metadata = { title: "API keys" }

const WIDE = "hidden @2xl:table-cell"
const USE_KEY = "flex min-w-0 flex-col gap-1.5"
const USE_KEY_LABEL = "text-sm leading-none font-medium"

/** Read after the agent's name, as in "Claude was approved". */
const EVENT_LABELS: Record<string, string> = {
  "approval.approved": "was approved",
  "approval.denied": "was denied",
  "agent.revoked": "was revoked",
  "agent.created": "asked to connect",
  "capability.requested": "asked for more access",
  "capability.granted": "was granted access",
  "capability.revoked": "lost access",
  "capability.executed": "used",
  "capability.called": "called",
}

function eventLabel(event: StoreAgentEvent): string {
  const label = EVENT_LABELS[event.type] ?? event.type
  if (!event.capability) return label
  return event.status === "error" ? `tried ${event.capability}, which failed` : `${label} ${event.capability}`
}

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<PageSkeleton action />}>
      <ApiKeysContent />
    </Suspense>
  )
}

async function ApiKeysContent() {
  if (!(await canManageStore())) {
    return (
      <DashboardFormPage>
        <PageHeader
          title="API keys"
          description="Only store owners and admins can manage API keys. Ask one of them for help."
        />
      </DashboardFormPage>
    )
  }

  const apiBase = requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL")
  const agentDiscovery = `${new URL(apiBase).origin}/.well-known/agent-configuration`
  const docsHref = `${requiredEnv(process.env.NEXT_PUBLIC_DOCS_URL, "NEXT_PUBLIC_DOCS_URL").replace(/\/$/, "")}/docs/api`
  const plan = await getActiveOrganizationPlan().catch(() => null)
  const { apiWriteEnabled: adminAllowed, agentAuthEnabled } = getEntitlements(plan?.planId ?? "free")
  const now = new Date()
  let keys: Awaited<ReturnType<typeof listOrgApiKeys>> = []
  let keysError: string | null = null
  let agents: Awaited<ReturnType<typeof listStoreAgents>> = []
  let events: StoreAgentEvent[] = []
  let agentsError: string | null = null

  const [keysResult, agentsResult, eventsResult] = await Promise.allSettled([
    listOrgApiKeys(),
    listStoreAgents(),
    listStoreAgentEvents(),
  ])
  if (keysResult.status === "fulfilled") {
    keys = keysResult.value
  } else {
    unstable_rethrow(keysResult.reason)
    console.error("[ApiKeysPage] listOrgApiKeys failed:", keysResult.reason)
    keysError = "We couldn't load your API keys. Refresh the page to try again."
  }
  if (eventsResult.status === "fulfilled") {
    events = eventsResult.value
  } else {
    // Only hides the activity panel; the agents and their revoke buttons stay.
    unstable_rethrow(eventsResult.reason)
    console.error("[ApiKeysPage] listStoreAgentEvents failed:", eventsResult.reason)
  }
  if (agentsResult.status === "fulfilled") {
    agents = agentsResult.value
  } else {
    unstable_rethrow(agentsResult.reason)
    console.error("[ApiKeysPage] listStoreAgents failed:", agentsResult.reason)
    agentsError = "We couldn't load your AI agents. Refresh the page to try again."
  }

  return (
    <DashboardPage>
      <PageHeader
        title="API keys"
        description="Your own code and AI agents reach the store through the same API as this dashboard."
        actions={
          <Button asChild variant="outline" size="lg">
            <a href={docsHref} target="_blank" rel="noopener noreferrer">
              <span>Read the API reference</span>
              <ArrowSquareOut aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        }
      />

      <ApiKeyCreateForm adminAllowed={adminAllowed} agentAuthAllowed={agentAuthEnabled} />

      <Panel title="Your keys" description="We only show a key's secret once, when you create it." flush>
        {keysError ? (
          <p role="alert" className="px-5 py-4 text-sm text-destructive">
            {keysError}
          </p>
        ) : keys.length > 0 ? (
          <ListTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className={WIDE}>Prefix</TableHead>
                <TableHead className={WIDE}>Scopes</TableHead>
                <TableHead className={`${WIDE} text-right`}>Requests</TableHead>
                <TableHead className={WIDE}>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => {
                const name = key.name ?? "Untitled key"
                return (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      {name}
                      <div className="text-xs font-normal text-muted-foreground @2xl:hidden">
                        {key.scopes.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs`}>{key.start ?? "pk"}</TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs`}>{key.scopes.join(", ")}</TableCell>
                    <TableCell className={`${WIDE} text-right tabular-nums`}>{formatNumber(key.requestCount)}</TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>
                      {key.lastRequest ? (
                        <time dateTime={key.lastRequest.toISOString()} title={formatDateTime(key.lastRequest)}>
                          {formatRelative(key.lastRequest, now)}
                        </time>
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell>
                      <Status look={apiKeyStatus(key.enabled)} />
                    </TableCell>
                    <TableCell className="w-px text-right">
                      {key.enabled ? <RevokeKeyButton id={key.id} name={name} /> : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </ListTable>
        ) : (
          <PanelEmpty
            icon={<Key />}
            title="No API keys yet"
            description="Keys you create show up here, so you can see when each was last used. Create one above to connect your own code."
          />
        )}
      </Panel>

      <Panel
        title="AI agents"
        description="Agents you approved through Agent Auth, and what each can do. Revoke one to cut it off right away."
        flush
      >
        {agentsError ? (
          <p role="alert" className="px-5 py-4 text-sm text-destructive">
            {agentsError}
          </p>
        ) : agents.length > 0 ? (
          <ListTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className={WIDE}>Approved by</TableHead>
                <TableHead className={WIDE}>Access</TableHead>
                <TableHead className={WIDE}>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const changes = agent.capabilities.filter(changesStore).length
                const access =
                  agent.capabilities.length === 0
                    ? "No access"
                    : `${agent.capabilities.length} ${agent.capabilities.length === 1 ? "capability" : "capabilities"}${
                        changes > 0 ? `, ${changes} that change your store` : ""
                      }`
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.name}
                      <div className="text-xs font-normal text-muted-foreground">
                        {[agent.hostName, agent.userName].filter(Boolean).join(" · ")}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground @2xl:hidden">{access}</div>
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>{agent.userName ?? "Unknown"}</TableCell>
                    <TableCell className={WIDE}>
                      <span title={agent.capabilities.join(", ")}>{access}</span>
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>
                      {agent.lastUsedAt ? (
                        <time dateTime={agent.lastUsedAt.toISOString()} title={formatDateTime(agent.lastUsedAt)}>
                          {formatRelative(agent.lastUsedAt, now)}
                        </time>
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell>
                      <Status look={agentStatus(agent.status)} />
                    </TableCell>
                    <TableCell className="w-px text-right">
                      {agent.status === "active" ? <RevokeAgentButton id={agent.id} name={agent.name} /> : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </ListTable>
        ) : (
          <PanelEmpty
            icon={<Robot />}
            title="No AI agents yet"
            description={
              agentAuthEnabled
                ? "When an agent asks to work on your store, you approve it in the dashboard and it shows up here."
                : "Agent Auth starts on Grow. Agents you approve show up here."
            }
          />
        )}
      </Panel>

      {events.length > 0 ? (
        <Panel title="Agent activity" description="The latest approvals, revocations and calls by AI agents on your store." flush>
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{event.agentName ?? "An agent"}</span>{" "}
                  <span className="text-muted-foreground">{eventLabel(event)}</span>
                </span>
                <time
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  dateTime={event.createdAt.toISOString()}
                  title={formatDateTime(event.createdAt)}
                >
                  {formatRelative(event.createdAt, now)}
                </time>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Use a key" description="Send the key in a header with every request.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className={USE_KEY}>
            <p className={USE_KEY_LABEL}>Header</p>
            <CopyBlock value="x-api-key" label="header name" />
          </div>
          <div className={USE_KEY}>
            <p className={USE_KEY_LABEL}>API address</p>
            <CopyBlock value={apiBase} label="API address" />
          </div>
          <div className={`${USE_KEY} md:col-span-2`}>
            <p className={USE_KEY_LABEL}>Agent Auth discovery</p>
            <CopyBlock value={agentDiscovery} label="Agent Auth discovery address" />
          </div>
        </div>
      </Panel>
    </DashboardPage>
  )
}
