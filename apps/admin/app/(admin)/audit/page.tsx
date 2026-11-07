import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { ListPagination, ListTable, NoValue, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@prood/ui/components/table"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { Timestamp } from "@/components/admin/timestamp"
import { listAuditEvents } from "@/lib/admin-queries"
import { assertAdmin } from "@/lib/auth"
import { shortIp } from "@/lib/format"

export const metadata = { title: "Audit log" }

const PATH = "/audit"
const WIDE = "hidden @3xl:table-cell"
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
]

const LABELS: Record<string, string> = {
  "user.ban": "Banned a user",
  "user.unban": "Unbanned a user",
  "user.set_role": "Changed a user's role",
  "user.revoke_sessions": "Signed a user out everywhere",
  "user.reset_two_factor": "Reset a user's two-factor",
  "session.revoke": "Signed one device out",
  "agent.revoke": "Revoked an AI agent",
}

/** The facts worth showing beside an action, in a few words. */
function detail(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null
  if (typeof metadata.role === "string") return `Role: ${metadata.role}`
  if (typeof metadata.reason === "string") return `Reason: ${metadata.reason}`
  return null
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, { sorts: ["createdAt"], defaultSort: "createdAt" })
  await assertAdmin()
  const { rows, total } = await listAuditEvents({
    q: list.q,
    limit: list.perPage,
    offset: list.offset,
    dir: list.dir,
  })
  if (rows.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader title="Audit log" description="What Prood administrators did to accounts. Times are UTC." />
      <Panel flush>
        <ListToolbar
          searchLabel="Search action, admin or target"
          sorts={SORT_OPTIONS}
          currentSort={list}
          foldsAt="3xl"
          tabs={[]}
        />
        {rows.length > 0 ? (
          <>
            <ListTable>
              <TableHeader>
                <TableRow>
                  <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc">
                    When
                  </SortableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className={WIDE}>Target</TableHead>
                  <TableHead className={WIDE}>IP address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      <Timestamp date={row.createdAt} />
                    </TableCell>
                    <TableCell>
                      {row.actorName ? (
                        <RowLink href={`/users/${row.actorId}`}>{row.actorName}</RowLink>
                      ) : (
                        <span className="text-muted-foreground">Deleted account</span>
                      )}
                      <div className="max-w-52 truncate text-xs text-muted-foreground">{row.actorEmail ?? row.actorId}</div>
                    </TableCell>
                    <TableCell>
                      {LABELS[row.action] ?? row.action}
                      {detail(row.metadata) ? (
                        <div className="text-xs text-muted-foreground">{detail(row.metadata)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs text-muted-foreground`}>
                      {row.targetType === "user" && row.targetId ? (
                        <Link href={`/users/${row.targetId}`} className="underline underline-offset-4">
                          {row.targetId}
                        </Link>
                      ) : (
                        (row.targetId ?? <NoValue />)
                      )}
                    </TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs text-muted-foreground`}>
                      {row.ipAddress ? shortIp(row.ipAddress) : <NoValue />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ListTable>
            <ListPagination list={list} pathname={PATH} total={total} noun="recorded action" />
          </>
        ) : (
          <PanelEmpty
            title={list.q ? "Nothing matches" : "Nothing recorded yet"}
            description={
              list.q
                ? "No recorded action fits this search."
                : "Bans, role changes and sign-outs by administrators show up here."
            }
            action={
              list.q ? (
                <Button asChild variant="outline">
                  <Link href={PATH}>Show everything</Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>
    </AdminPage>
  )
}
