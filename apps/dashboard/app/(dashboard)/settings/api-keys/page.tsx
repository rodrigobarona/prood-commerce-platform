import { Suspense } from "react"
import { unstable_rethrow } from "next/navigation"
import { ArrowSquareOut, Key } from "@phosphor-icons/react/dist/ssr"
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
import { getActiveOrganizationPlan } from "@/lib/billing"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { apiKeyStatus } from "@/lib/status"
import { ApiKeyCreateForm } from "./api-key-create-form"
import { RevokeKeyButton } from "./revoke-key-button"
import { requiredEnv } from "@prood/types"

export const metadata = { title: "API keys" }

const WIDE = "hidden @2xl:table-cell"
const USE_KEY = "flex min-w-0 flex-col gap-1.5"
const USE_KEY_LABEL = "text-sm leading-none font-medium"

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

  try {
    keys = await listOrgApiKeys()
  } catch (error) {
    unstable_rethrow(error)
    console.error("[ApiKeysPage] listOrgApiKeys failed:", error)
    keysError = "We couldn't load your API keys. Refresh the page to try again."
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
