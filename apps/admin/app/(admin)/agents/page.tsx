import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { FOLD_CELL_4XL, ListPagination, ListTable, NoValue, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { RevokeAgentButton } from "@/components/admin/agent-actions"
import { Timestamp } from "@/components/admin/timestamp"
import { AGENT_FILTERS, getAgentCounts, listAgents, type AgentSort } from "@/lib/admin-queries"
import { humanize } from "@/lib/format"
import { agentStatus } from "@/lib/status"

export const metadata = { title: "AI agents" }

const PATH = "/agents"
const WIDE = "hidden @4xl:table-cell"
const SORTS: readonly AgentSort[] = ["createdAt", "name"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Name, A to Z", sort: "name", dir: "asc" },
  { label: "Name, Z to A", sort: "name", dir: "desc" },
]

export default async function AgentsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabs: AGENT_FILTERS,
    sorts: SORTS,
    defaultSort: "createdAt",
  })

  const [{ rows: agents, total }, counts] = await Promise.all([
    listAgents({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      filter: list.tab,
      sort: list.sort ?? "createdAt",
      dir: list.dir,
    }),
    getAgentCounts(),
  ])
  if (agents.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader title="AI agents" description="AI agents registered through Agent Auth." />

      {counts.all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No AI agents yet"
            description="AI agents show up here when an owner approves one through Agent Auth, so you can see what's connected and turn it off."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/users">View users</Link>
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel flush>
          <ListToolbar
            searchLabel="Search agent, host or user"
            tabsLabel="Filter AI agents by status"
            sorts={SORT_OPTIONS}
            currentSort={list}
            foldsAt="4xl"
            tabs={[
              { value: "", label: "All", count: counts.all },
              ...AGENT_FILTERS.map((status) => ({
                value: status,
                label: humanize(status),
                count: counts.byStatus[status] ?? 0,
              })),
            ]}
          />
          {agents.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <SortableHead list={list} pathname={PATH} field="name">
                      Name
                    </SortableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className={WIDE}>Mode</TableHead>
                    <TableHead className={WIDE}>Host</TableHead>
                    <TableHead className={WIDE}>User</TableHead>
                    <TableHead className={WIDE}>Last used</TableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Created
                    </SortableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className={`${FOLD_CELL_4XL} font-medium`}>
                        {agent.name}
                        <div className="truncate text-xs font-normal text-muted-foreground @4xl:hidden">
                          {[agent.hostName, agent.userName].filter(Boolean).join(" · ") || humanize(agent.mode)}
                        </div>
                        {agent.status === "pending" ? (
                          <div className="text-xs font-normal whitespace-normal text-muted-foreground">
                            Waiting for the store owner to approve it.
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Status look={agentStatus(agent.status)} />
                      </TableCell>
                      <TableCell className={WIDE}>{humanize(agent.mode)}</TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground`}>
                        {agent.hostName ?? <NoValue />}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground`}>
                        {agent.userName ?? <NoValue />}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        {agent.lastUsedAt ? <Timestamp date={agent.lastUsedAt} /> : "Never"}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        <Timestamp date={agent.createdAt} />
                      </TableCell>
                      <TableCell className="w-px py-0! text-right">
                        {agent.status === "active" ? <RevokeAgentButton id={agent.id} name={agent.name} /> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="AI agent" />
            </>
          ) : (
            <PanelEmpty
              title="No AI agents match"
              description="Nothing fits this search and status."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all AI agents</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
