import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { ListPagination, ListTable, NoValue, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { StatusBadge } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { RevokeSessionButton } from "@/components/admin/revoke-session-button"
import { Timestamp } from "@/components/admin/timestamp"
import { getSessionCounts, listSessions, type SessionSort } from "@/lib/admin-queries"
import { assertAdmin } from "@/lib/auth"
import { describeUserAgent, shortIp } from "@/lib/format"

export const metadata = { title: "Sessions" }

const PATH = "/sessions"
const WIDE = "hidden @3xl:table-cell"
const SORTS: readonly SessionSort[] = ["createdAt", "expiresAt"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Expiring first", sort: "expiresAt", dir: "asc" },
  { label: "Expiring last", sort: "expiresAt", dir: "desc" },
]

export default async function SessionsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabParam: "show",
    tabs: ["impersonated"],
    sorts: SORTS,
    defaultSort: "createdAt",
    keep: ["user"],
  })
  const userId = list.params.user

  const [admin, { rows: sessions, total }, counts] = await Promise.all([
    assertAdmin(),
    listSessions({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      impersonated: list.tab === "impersonated",
      userId,
      sort: list.sort ?? "createdAt",
      dir: list.dir,
    }),
    getSessionCounts(),
  ])
  if (sessions.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader
        title="Sessions"
        description="Everyone signed in to Prood right now. Times are UTC."
      />

      {counts.all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No active sessions"
            description="Sessions show up here when someone signs in, so you can see who's on Prood."
          />
        </Panel>
      ) : (
        <Panel flush>
          <ListToolbar
            searchLabel="Search name, email or IP"
            tabParam="show"
            tabsLabel="Filter sessions"
            sorts={SORT_OPTIONS}
            currentSort={list}
            foldsAt="3xl"
            tabs={[
              { value: "", label: "All", count: counts.all },
              { value: "impersonated", label: "Impersonated", count: counts.impersonated },
            ]}
          />
          {userId ? (
            <p className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-5 py-2 text-sm text-muted-foreground">
              One user&apos;s sessions
              <Link href={PATH} className="text-foreground underline underline-offset-4">
                Show everyone
              </Link>
            </p>
          ) : null}
          {sessions.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className={WIDE}>Device</TableHead>
                    <TableHead className={WIDE}>IP address</TableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Started
                    </SortableHead>
                    <SortableHead list={list} pathname={PATH} field="expiresAt" className={WIDE}>
                      Expires
                    </SortableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const device = describeUserAgent(session.userAgent)
                    const current = session.id === admin.session.id
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <RowLink href={`/users/${session.userId}`}>{session.userName}</RowLink>
                          {session.impersonatedBy ? (
                            <StatusBadge tone="warning" className="ml-2">
                              Impersonated
                            </StatusBadge>
                          ) : null}
                          <div className="max-w-52 truncate text-xs text-muted-foreground">{session.userEmail}</div>
                          <div className="text-xs text-muted-foreground @3xl:hidden">
                            {device ?? "Unknown device"} · <Timestamp date={session.createdAt} />
                          </div>
                        </TableCell>
                        <TableCell className={WIDE} title={session.userAgent ?? undefined}>
                          {device ?? <NoValue />}
                        </TableCell>
                        <TableCell className={`${WIDE} font-mono text-xs text-muted-foreground`} title={session.ipAddress ?? undefined}>
                          {session.ipAddress ? shortIp(session.ipAddress) : <NoValue />}
                        </TableCell>
                        <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                          <Timestamp date={session.createdAt} />
                        </TableCell>
                        <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                          <Timestamp date={session.expiresAt} />
                        </TableCell>
                        <TableCell className="w-px text-right">
                          {current ? (
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <RevokeSessionButton
                              sessionId={session.id}
                              userId={session.userId}
                              userName={session.userName}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="active session" />
            </>
          ) : (
            <PanelEmpty
              title="No sessions match"
              description="Nothing fits this search and filter."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all sessions</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
